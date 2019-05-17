package main

import (
	"os"
	"os/exec"
	"path/filepath"
)

func changeProxyModeNative(args ...string) (message string, err error) {
	var runner = filepath.Join(execDir(), "networksetup-osx.sh")
	out, err := exec.Command(runner, args...).CombinedOutput()
	message = string(out)
	return
}

var privoxyRunner *exec.Cmd

func runPrivoxyNative(conf string) (err error) {
	var runner = filepath.Join(execDir(), "privoxy")
	privoxyRunner = exec.Command(runner, "--no-daemon", conf)
	privoxyRunner.Stderr = os.Stdout
	privoxyRunner.Stdout = os.Stderr
	err = privoxyRunner.Start()
	if err == nil {
		err = privoxyRunner.Wait()
	}
	privoxyRunner = nil
	return
}
