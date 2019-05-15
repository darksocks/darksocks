#!/bin/bash
set -e
pkg_ver=1.4.2
pkg_osx(){
    rm -rf dist/
    rm -rf out/DarkSocks-darwin-x64-$pkg_ver
    rm -rf darksocks
    7z x ../build/darksocks-$pkg_ver-Darwin.zip
    npm run pack-osx
    cd out
    plutil -insert LSUIElement -bool true DarkSocks-darwin-x64/DarkSocks.app/Contents/Info.plist
    mv DarkSocks-darwin-x64 DarkSocks-darwin-x64-$pkg_ver
    7z a -r DarkSocks-darwin-x64-$pkg_ver.zip DarkSocks-darwin-x64-$pkg_ver
    cd ../
}
pkg_linux(){
    rm -rf dist/
    rm -rf out/DarkSocks-linux-x64-$pkg_ver
    rm -rf darksocks
    7z x ../build/darksocks-$pkg_ver-Linux.zip
    npm run pack-linux
    cd out
    mv DarkSocks-linux-x64 DarkSocks-linux-x64-$pkg_ver
    7z a -r DarkSocks-linux-x64-$pkg_ver.zip DarkSocks-linux-x64-$pkg_ver
    cd ../
}
pkg_win(){
    rm -rf dist/
    rm -rf out/DarkSocks-win32-ia32-$pkg_ver
    rm -rf darksocks
    7z x ../build/darksocks-$pkg_ver-Win-386.zip
    npm run pack-win
    cd out
    mv DarkSocks-win32-ia32 DarkSocks-win32-ia32-$pkg_ver
    7z a -r DarkSocks-win32-ia32-$pkg_ver.zip DarkSocks-win32-ia32-$pkg_ver
    cd ../
}

case $1 in
osx)
    pkg_osx
;;
linux)
    pkg_linux
;;
win)
    pkg_win
;;
all)
    rm -rf out
    pkg_osx
    pkg_win
;;
esac