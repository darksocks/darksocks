@echo off
cd /d %~dp0
nssm stop "darksocks"
nssm remove "darksocks" confirm
pause