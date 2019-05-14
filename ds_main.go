package main

import (
	"flag"
	"log"
	"os"
)

func main() {
	log.SetFlags(log.Lshortfile | log.Ldate | log.Lmicroseconds)
	log.SetOutput(os.Stdout)
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
