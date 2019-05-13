package ds

import (
	"crypto/sha1"
	"encoding/json"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net"
	"os"
	"time"

	"golang.org/x/net/websocket"
)

//BasePipe is func to create os pipe
var BasePipe = os.Pipe

//PipedConn is connection piped read and write
type PipedConn struct {
	io.Reader
	io.Writer
	Alias string
}

//CreatePipeConn will create pipe connection
func CreatePipeConn() (a, b *PipedConn, err error) {
	aReader, bWriter, err := BasePipe()
	if err != nil {
		return
	}
	bReader, aWriter, err := BasePipe()
	if err != nil {
		aReader.Close()
		bWriter.Close()
		return
	}
	a = &PipedConn{
		Reader: aReader,
		Writer: aWriter,
		Alias:  fmt.Sprintf("%v,%v", aReader, aWriter),
	}
	b = &PipedConn{
		Reader: bReader,
		Writer: bWriter,
		Alias:  fmt.Sprintf("%v,%v", bReader, bWriter),
	}
	return
}

//Close will close Reaer/Writer
func (p *PipedConn) Close() (err error) {
	if closer, ok := p.Reader.(io.Closer); ok {
		err = closer.Close()
	}
	if closer, ok := p.Writer.(io.Closer); ok {
		xerr := closer.Close()
		if err == nil {
			err = xerr
		}
	}
	return
}

//Network is net.Addr impl
func (p *PipedConn) Network() string {
	return "Piped"
}

//LocalAddr is net.Conn impl
func (p *PipedConn) LocalAddr() net.Addr {
	return p
}

//RemoteAddr is net.Conn impl
func (p *PipedConn) RemoteAddr() net.Addr {
	return p
}

//SetDeadline is net.Conn impl
func (p *PipedConn) SetDeadline(t time.Time) error {
	return nil
}

//SetReadDeadline is net.Conn impl
func (p *PipedConn) SetReadDeadline(t time.Time) error {
	return nil
}

//SetWriteDeadline is net.Conn impl
func (p *PipedConn) SetWriteDeadline(t time.Time) error {
	return nil
}

func (p *PipedConn) String() string {
	return p.Alias
}

//DebugLog is the debug level log
func DebugLog(format string, args ...interface{}) {
	log.Output(1, fmt.Sprintf("D "+format, args...))
}

//InfoLog is the info level log
func InfoLog(format string, args ...interface{}) {
	log.Output(1, fmt.Sprintf("I "+format, args...))
}

//WarnLog is the warn level log
func WarnLog(format string, args ...interface{}) {
	log.Output(1, fmt.Sprintf("W "+format, args...))
}

//ErrorLog is the error level log
func ErrorLog(format string, args ...interface{}) {
	log.Output(1, fmt.Sprintf("E "+format, args...))
}

//WriteJSON will marshal value to json and write to file
func WriteJSON(filename string, v interface{}) (err error) {
	data, err := json.MarshalIndent(v, "", " ")
	if err == nil {
		err = ioutil.WriteFile(filename, data, os.ModePerm)
	}
	return
}

//ReadJSON will read file and unmarshal to value
func ReadJSON(filename string, v interface{}) (err error) {
	data, err := ioutil.ReadFile(filename)
	if err == nil {
		err = json.Unmarshal(data, v)
	}
	return
}

//SHA1 will get sha1 hash of data
func SHA1(data []byte) string {
	s := sha1.New()
	s.Write(data)
	return fmt.Sprintf("%x", s.Sum(nil))
}

//StringConn is an ReadWriteCloser for return  remote address info
type StringConn struct {
	io.ReadWriteCloser
}

//NewStringConn will return new StringConn
func NewStringConn(raw io.ReadWriteCloser) *StringConn {
	return &StringConn{
		ReadWriteCloser: raw,
	}
}

func (s *StringConn) String() string {
	if wsc, ok := s.ReadWriteCloser.(*websocket.Conn); ok {
		return fmt.Sprintf("%v", wsc.RemoteAddr())
	}
	if netc, ok := s.ReadWriteCloser.(net.Conn); ok {
		return fmt.Sprintf("%v", netc.RemoteAddr())
	}
	return fmt.Sprintf("xxx ss->%v", s.ReadWriteCloser)
}
