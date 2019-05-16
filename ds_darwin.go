package main

import (
	"io/ioutil"
	"os/exec"
	"path/filepath"
)

func changeProxyModeNative(args ...string) (message string, err error) {
	var runner = filepath.Join(execDir(), "networksetup-osx.sh")
	out, err := exec.Command(runner, args...).CombinedOutput()
	message = string(out)
	return
}

func runPrivoxyNative(conf string) (err error) {
	var runner = filepath.Join(execDir(), "privoxy")
	cmd := exec.Command(runner, "--no-daemon", conf)
	cmd.Stderr = ioutil.Discard
	cmd.Stdout = ioutil.Discard
	err = cmd.Start()
	if err == nil {
		err = cmd.Wait()
	}
	return
}
