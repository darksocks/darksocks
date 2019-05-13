package main

import (
	"bufio"
	"encoding/binary"
	"fmt"
	"io"
	"net"
	"testing"
	"time"
)

func runEcho(listen string) (err error) {
	listener, err := net.Listen("tcp", listen)
	if err != nil {
		return
	}
	var conn net.Conn
	for {
		conn, err = listener.Accept()
		if err != nil {
			break
		}
		fmt.Printf("echo accept from %v\n", conn.RemoteAddr())
		go func() {
			io.Copy(conn, conn)
		}()
	}
	return
}

func TestDS(t *testing.T) {
	exitf = func(code int) {}
	go runEcho(":10331")
	go func() {
		// time.Sleep(100 * time.Millisecond)
		// stopServer()
	}()
	go func() {
		err := startServer("darksocks.json")
		if err != nil {
			t.Error(err)
			return
		}
	}()
	go func() {
		err := startClient("darksocks.json")
		if err != nil {
			t.Error(err)
			return
		}
	}()
	time.Sleep(time.Millisecond)
	conn, err := proxyDial(t, "127.0.0.1:1089", "127.0.0.1", 10331)
	if err != nil {
		t.Error(err)
		return
	}
	fmt.Fprintf(conn, "xxx->")
	buf := make([]byte, 1024)
	readed, err := conn.Read(buf)
	fmt.Println(string(buf[:readed]))
	stopServer()
	//
	time.Sleep(time.Millisecond)
}

func proxyDial(t *testing.T, proxy, remote string, port uint16) (conn net.Conn, err error) {
	conn, err = net.Dial("tcp", proxy)
	if err != nil {
		t.Error(err)
		return
	}
	buf := make([]byte, 1024*64)
	proxyReader := bufio.NewReader(conn)
	_, err = conn.Write([]byte{0x05, 0x01, 0x00})
	if err != nil {
		return
	}
	err = fullBuf(proxyReader, buf, 2, nil)
	if err != nil {
		return
	}
	if buf[0] != 0x05 || buf[1] != 0x00 {
		err = fmt.Errorf("only ver 0x05 / method 0x00 is supported, but %x/%x", buf[0], buf[1])
		return
	}
	buf[0], buf[1], buf[2], buf[3] = 0x05, 0x01, 0x00, 0x03
	buf[4] = byte(len(remote))
	copy(buf[5:], []byte(remote))
	binary.BigEndian.PutUint16(buf[5+len(remote):], port)
	_, err = conn.Write(buf[:buf[4]+7])
	if err != nil {
		return
	}
	_, err = proxyReader.Read(buf)
	return
}

func fullBuf(r io.Reader, p []byte, length uint32, last *int64) error {
	all := uint32(0)
	buf := p[:length]
	for {
		readed, err := r.Read(buf)
		if err != nil {
			return err
		}
		if last != nil {
			*last = time.Now().Local().UnixNano() / 1e6
		}
		all += uint32(readed)
		if all < length {
			buf = p[all:]
			continue
		} else {
			break
		}
	}
	return nil
}
