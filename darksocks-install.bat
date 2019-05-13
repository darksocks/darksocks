@echo off
cd /d %~dp0
mkdir logs
nssm install "darksocks" %CD%\darksocks.exe -c -f %CD%\darksocks.json
nssm set "darksocks" AppStdout %CD%\logs\out.log
nssm set "darksocks" AppStderr %CD%\logs\err.log
nssm start "darksocks"
pause