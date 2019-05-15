package main

import (
	"os"
	"os/exec"
	"path/filepath"
)

func workDir() (dir string) {
	home, _ := os.UserHomeDir()
	dir = filepath.Join(home, ".darksocks")
	if _, err := os.Stat(dir); err != nil {
		os.MkdirAll(dir, os.ModePerm)
	}
	return
}

func execDir() (dir string) {
	dir, _ = exec.LookPath(os.Args[0])
	dir = filepath.Dir(dir)
	return
}
