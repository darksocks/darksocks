package main

import (
	"flag"
	"log"
	"net"
	"os"
	"time"
)

func main() {
	log.SetFlags(log.Lshortfile | log.Lmicroseconds)
	var conf string
	flag.StringVar(&conf, "f", "/etc/darksocks/darksocks.json", "the dark socket configure file")
	var runServer bool
	flag.BoolVar(&runServer, "s", false, "start dark socket server")
	var runClient bool
	flag.BoolVar(&runClient, "c", false, "start dark socket client")
	flag.Parse()
	if runServer {
		startServer(conf)
	} else if runClient {
		startClient(conf)
	} else {
		flag.Usage()
	}
}

var exitf = os.Exit

type tcpKeepAliveListener struct {
	*net.TCPListener
}

func (ln tcpKeepAliveListener) Accept() (net.Conn, error) {
	tc, err := ln.AcceptTCP()
	if err == nil {
		tc.SetKeepAlive(true)
		tc.SetKeepAlivePeriod(3 * time.Minute)
	}
	return tc, nil
}
