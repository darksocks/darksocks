package ds

import (
	"encoding/binary"
	"fmt"
	"io"
	"io/ioutil"
	"math/rand"
	"net"
	"net/http"
	"sync"
	"sync/atomic"

	"golang.org/x/net/websocket"
)

const (
	//DefaultBufferSize is default buffer size
	DefaultBufferSize = 64 * 1024
)

//connSequence is the sequence to create Conn.ID()
var connSequence uint64

//Conn imple read/write raw connection by command mode
type Conn struct {
	id     uint64
	buf    []byte
	offset uint32
	length uint32
	raw    io.ReadWriter
	Err    error
}

//NewConn will create new Conn by raw reader/writer and buffer size
func NewConn(raw io.ReadWriter, bufferSize int) (conn *Conn) {
	conn = &Conn{
		id:  atomic.AddUint64(&connSequence, 1),
		buf: make([]byte, bufferSize),
		raw: raw,
	}
	return
}

//ID will reture connection id
func (c *Conn) ID() uint64 {
	return c.id
}

//readMore will read more data to buffer
func (c *Conn) readMore() (err error) {
	readed, err := c.raw.Read(c.buf[c.offset+c.length:])
	if err == nil {
		c.length += uint32(readed)
	}
	return
}

//ReadCmd will read raw reader as command mode.
//the commad protocol is:lenght(4 byte)+data
func (c *Conn) ReadCmd() (cmd []byte, err error) {
	more := c.length < 5
	for {
		if more {
			err = c.readMore()
			if err != nil {
				break
			}
			if c.length < 5 {
				continue
			}
		}
		c.buf[c.offset] = 0
		frameLength := binary.BigEndian.Uint32(c.buf[c.offset:])
		if frameLength > uint32(len(c.buf)) {
			err = fmt.Errorf("frame too large")
			break
		}
		if c.length < frameLength {
			more = true
			if c.offset > 0 {
				copy(c.buf[0:], c.buf[c.offset:c.offset+c.length])
				c.offset = 0
			}
			continue
		}
		cmd = c.buf[c.offset+4 : c.offset+frameLength]
		c.offset += frameLength
		c.length -= frameLength
		more = c.length <= 4
		if c.length < 1 {
			c.offset = 0
		}
		break
	}
	return
}

//WriteCmd will write data by command mode
func (c *Conn) WriteCmd(cmd []byte) (w int, err error) {
	binary.BigEndian.PutUint32(cmd, uint32(len(cmd)))
	cmd[0] = byte(rand.Intn(255))
	w, err = c.raw.Write(cmd)
	return
}

//Close will check raw if io.Closer and close it
func (c *Conn) Close() (err error) {
	if closer, ok := c.raw.(io.Closer); ok {
		err = closer.Close()
	}
	c.Err = fmt.Errorf("closed")
	return
}

func (c *Conn) String() string {
	if wsc, ok := c.raw.(*websocket.Conn); ok {
		return fmt.Sprintf("%v", wsc.RemoteAddr())
	}
	if netc, ok := c.raw.(net.Conn); ok {
		return fmt.Sprintf("%v", netc.RemoteAddr())
	}
	return fmt.Sprintf("%v", c.raw)
}

//copyRemote2Channel will read target connection data and write to channel connection by command mode
func copyRemote2Channel(bufferSize int, conn *Conn, target io.ReadWriteCloser) (err error) {
	var readed int
	buf := make([]byte, bufferSize)
	for {
		readed, err = target.Read(buf[5:])
		if err != nil {
			break
		}
		// fmt.Printf("R2C:%v->%v:%v\n", target, conn, readed)
		buf[4] = CmdConnData
		_, err = conn.WriteCmd(buf[:readed+5])
		if err != nil {
			conn.Err = err
			break
		}
	}
	target.Close()
	if conn.Err == nil {
		conn.WriteCmd(append([]byte{0, 0, 0, 0, CmdConnClose}, []byte(err.Error())...))
	}
	return
}

//copyChannel2Remote will read channel connection data by command mode and write to target
func copyChannel2Remote(conn *Conn, target io.ReadWriteCloser) (err error) {
	var cmd []byte
	for {
		cmd, err = conn.ReadCmd()
		if err != nil {
			conn.Err = err
			break
		}
		// fmt.Printf("C2R:%v->%v:%v\n", conn, target, len(cmd))
		switch cmd[0] {
		case CmdConnData:
			_, err = target.Write(cmd[1:])
		case CmdConnClose:
			err = fmt.Errorf("%v", string(cmd[1:]))
		default:
			err = fmt.Errorf("error command:%x", cmd[0])
			conn.Err = err
		}
		if err != nil {
			break
		}
	}
	target.Close()
	return
}

const (
	//CmdConnDial is ds protocol command for dial connection
	CmdConnDial = 0x10
	//CmdConnBack is ds protocol command for dial connection back
	CmdConnBack = 0x20
	//CmdConnData is ds protocol command for transfer data
	CmdConnData = 0x30
	//CmdConnClose is ds protocol command for connection close
	CmdConnClose = 0x40
)

//Server is the main implementation for dark socks
type Server struct {
	BufferSize int
	Dialer     Dialer
}

//NewServer will create Server by buffer size and dialer
func NewServer(bufferSize int, dialer Dialer) (server *Server) {
	server = &Server{
		BufferSize: bufferSize,
		Dialer:     dialer,
	}
	return
}

//ProcConn will start process proxy connection
func (s *Server) ProcConn(conn *Conn) (err error) {
	InfoLog("Server one channel is starting from %v", conn)
	for {
		cmd, xerr := conn.ReadCmd()
		if xerr != nil {
			conn.Err = xerr
			break
		}
		if cmd[0] != CmdConnDial {
			WarnLog("Server connection from %v will be closed by expected dail command, but %x", conn, cmd[0])
			xerr = fmt.Errorf("protocol error")
			conn.Err = xerr
			break
		}
		targetURI := string(cmd[1:])
		DebugLog("Server receive dail connec to %v from %v", targetURI, conn)
		target, xerr := s.Dialer.Dial(targetURI)
		if xerr != nil {
			InfoLog("Server dial to %v fail with %v", targetURI, xerr)
			conn.WriteCmd(append([]byte{0, 0, 0, 0, CmdConnBack}, []byte(xerr.Error())...))
			continue
		}
		conn.WriteCmd(append([]byte{0, 0, 0, 0, CmdConnBack}, []byte("ok")...))
		DebugLog("Server transfer is started from %v to %v", conn, target)
		s.procRemote(conn, target)
		DebugLog("Server transfer is stopped from %v to %v", conn, target)
		if conn.Err != nil {
			break
		}
	}
	conn.Close()
	InfoLog("Server the channel(%v) is stopped by %v", conn, conn.Err)
	err = conn.Err
	return
}

//procRemote will transfer data between channel and target
func (s *Server) procRemote(conn *Conn, target io.ReadWriteCloser) (err error) {
	wait := sync.WaitGroup{}
	wait.Add(1)
	go func() {
		copyChannel2Remote(conn, target)
		wait.Done()
	}()
	err = copyRemote2Channel(s.BufferSize, conn, target)
	wait.Wait()
	return
}

//Client is normal client for implement dark socket protocl
type Client struct {
	conns      map[uint64]*Conn
	connsLck   sync.RWMutex
	BufferSize int
	Dialer     Dialer
	HTTPClient *http.Client
}

//NewClient will create client by buffer size and dialer
func NewClient(bufferSize int, dialer Dialer) (client *Client) {
	client = &Client{
		conns:      map[uint64]*Conn{},
		connsLck:   sync.RWMutex{},
		BufferSize: bufferSize,
		Dialer:     dialer,
	}
	client.HTTPClient = &http.Client{
		Transport: &http.Transport{
			Dial: client.httpDial,
		},
	}
	return
}

//Close will close all proc connection
func (c *Client) Close() (err error) {
	c.connsLck.Lock()
	for _, conn := range c.conns {
		conn.Close()
	}
	c.connsLck.Unlock()
	return
}

func (c *Client) httpDial(network, addr string) (conn net.Conn, err error) {
	proxy, conn, err := CreatePipeConn()
	if err == nil {
		go c.ProcConn(proxy, addr)
	}
	return
}

//pullConn will return Conn in idle pool, if pool is empty, dial new by Dialer
func (c *Client) pullConn() (conn *Conn, err error) {
	c.connsLck.Lock()
	for _, conn = range c.conns {
		delete(c.conns, conn.ID())
		break
	}
	c.connsLck.Unlock()
	if conn != nil {
		DebugLog("Client pull one connection from idel pool")
		return
	}
	raw, err := c.Dialer.Dial("")
	if err != nil {
		return
	}
	conn = NewConn(raw, c.BufferSize)
	return
}

//pushConn will push one Conn to idle pool
func (c *Client) pushConn(conn *Conn) {
	c.connsLck.Lock()
	c.conns[conn.ID()] = conn
	c.connsLck.Unlock()
	DebugLog("Client push one channel to idle pool")
}

//ProcConn will start process proxy connection
func (c *Client) ProcConn(raw io.ReadWriteCloser, target string) (err error) {
	defer raw.Close()
	conn, err := c.pullConn()
	if err != nil {
		return
	}
	DebugLog("Client try proxy %v to %v for %v", raw, conn, target)
	_, err = conn.WriteCmd(append([]byte{0, 0, 0, 0, CmdConnDial}, []byte(target)...))
	if err != nil {
		conn.Err = err
		conn.Close()
		return
	}
	back, err := conn.ReadCmd()
	if err != nil {
		conn.Err = err
		conn.Close()
		return
	}
	if back[0] != CmdConnBack {
		err = fmt.Errorf("protocol error, expected back command, but %x", back[0])
		WarnLog("Client will close connection(%v) by %v", conn, err)
		conn.Err = err
		conn.Close()
		return
	}
	backMessage := string(back[1:])
	if backMessage != "ok" {
		err = fmt.Errorf("%v", backMessage)
		c.pushConn(conn)
		return
	}
	DebugLog("Client start transfer %v to %v for %v", raw, conn, target)
	c.procRemote(conn, raw)
	DebugLog("Client stop transfer %v to %v for %v", raw, conn, target)
	if conn.Err != nil {
		InfoLog("Client the channel(%v) is stopped by %v", conn, conn.Err)
		err = conn.Err
		conn.Close()
	} else {
		c.pushConn(conn)
	}
	return
}

//procRemote will tansfer data between channel Conn and target connection.
func (c *Client) procRemote(conn *Conn, target io.ReadWriteCloser) (err error) {
	wait := sync.WaitGroup{}
	wait.Add(1)
	go func() {
		copyChannel2Remote(conn, target)
		wait.Done()
	}()
	err = copyRemote2Channel(c.BufferSize, conn, target)
	wait.Wait()
	return
}

//HTTPGet will do http get request by proxy
func (c *Client) HTTPGet(uri string) (data []byte, err error) {
	resp, err := c.HTTPClient.Get(uri)
	if err == nil {
		data, err = ioutil.ReadAll(resp.Body)
		resp.Body.Close()
	}
	return
}
