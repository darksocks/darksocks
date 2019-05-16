package main

import (
	"os/exec"
	"path/filepath"
)

func changeProxyModeNative(args ...string) (message string, err error) {
	var runner = filepath.Join(execDir(), "networksetup-osx.sh")
	out, err := exec.Command(runner, args...).CombinedOutput()
	message = string(out)
	return
}
