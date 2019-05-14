package ds

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"sync"
	"testing"
	"time"
)

func TestPipeConn(t *testing.T) {
	a, b, err := CreatePipeConn()
	if err != nil {
		t.Error(err)
		return
	}
	wait := sync.WaitGroup{}
	wait.Add(2)
	go func() {
		buf := bytes.NewBuffer(nil)
		io.Copy(buf, a)
		fmt.Printf("A:%v\n", string(buf.Bytes()))
		wait.Done()
	}()
	go func() {
		buf := bytes.NewBuffer(nil)
		io.Copy(buf, b)
		fmt.Printf("B:%v\n", string(buf.Bytes()))
		wait.Done()
	}()
	fmt.Fprintf(a, "a message")
	fmt.Fprintf(b, "b message")
	time.Sleep(time.Millisecond)
	a.Close()
	wait.Wait()
	//
	//test error
	var callc = 0
	BasePipe = func() (r, w *os.File, err error) {
		callc++
		if callc > 1 {
			err = fmt.Errorf("error")
		} else {
			r, w, err = os.Pipe()
		}
		return
	}
	_, _, err = CreatePipeConn()
	if err == nil {
		t.Error(err)
		return
	}
	_, _, err = CreatePipeConn()
	if err == nil {
		t.Error(err)
		return
	}
}

func TestLog(t *testing.T) {
	//
	SetLogLevel(LogLevelDebug)
	DebugLog("debug")
	InfoLog("info")
	WarnLog("warn")
	ErrorLog("error")
	//
	SetLogLevel(LogLevelInfo)
	DebugLog("debug")
	InfoLog("info")
	WarnLog("warn")
	ErrorLog("error")
	//
	SetLogLevel(LogLevelWarn)
	DebugLog("debug")
	InfoLog("info")
	WarnLog("warn")
	ErrorLog("error")
	//
	SetLogLevel(LogLevelError)
	DebugLog("debug")
	InfoLog("info")
	WarnLog("warn")
	ErrorLog("error")
}

func TestSHA(t *testing.T) {
	fmt.Println(SHA1([]byte("123")))
}
