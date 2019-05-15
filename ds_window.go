package main

import (
	"os/exec"
	"path/filepath"
	"runtime"
)

func changeProxyModeNative(args ...string) (message string, err error) {
	var runner = filepath.Join(execDir(), "sysproxy.exe")
	if runtime.GOARCH == "amd64" {
		runner = filepath.Join(execDir(), "sysproxy64.exe")
	}
	var cmd *exec.Cmd
	switch args[0] {
	case "auto":
		cmd = exec.Command(runner, "pac", args[1])
	case "global":
		cmd = exec.Command(runner, "global", args[1]+":"+args[2])
	default:
		cmd = exec.Command(runner, "off")
	}
	out, err := cmd.CombinedOutput()
	message = string(out)
	return
}
