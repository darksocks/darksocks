package main

import "os/exec"

func changeProxyModeNative(args ...string) (message string, err error) {
	out, err := exec.Command("./networksetup-osx.sh", args...).CombinedOutput()
	message = string(out)
	return
}
