#!/bin/bash
set -e
pkg_ver=0.1.0
pkg_osx(){
    rm -rf dist/
    rm -rf "out/Dark Socks-darwin-x64-$pkg_ver"
    rm -rf darksocks
    7z x ../build/darksocks-$pkg_ver-Darwin.zip
    npm run pack-osx
    cd out
    # plutil -insert LSUIElement -bool true Dark Socks-darwin-x64/Dark Socks.app/Contents/Info.plist
    mv "Dark Socks-darwin-x64" "Dark Socks-darwin-x64-$pkg_ver"
    7z a -r "Dark Socks-darwin-x64-$pkg_ver.zip" "Dark Socks-darwin-x64-$pkg_ver" -x!*.ts -x!*.map -x!*.h -x!*.m -x!*.md -x!*.scss
    cd ../
}
pkg_linux(){
    rm -rf dist/
    rm -rf "out/Dark Socks-linux-x64-$pkg_ver"
    rm -rf darksocks
    7z x ../build/darksocks-$pkg_ver-Linux.zip
    npm run pack-linux
    cd out
    mv "Dark Socks-linux-x64 Dark Socks-linux-x64-$pkg_ver"
    7z a -r "Dark Socks-linux-x64-$pkg_ver.zip" "Dark Socks-linux-x64-$pkg_ver"
    cd ../
}
pkg_win(){
    rm -rf dist/
    rm -rf "out/Dark Socks-win32-ia32-$pkg_ver"
    rm -rf darksocks
    7z x ../build/darksocks-$pkg_ver-Win-386.zip
    npm run pack-win
    cd out
    mv Dark "Socks-win32-ia32 Dark Socks-win32-ia32-$pkg_ver"
    7z a -r "Dark Socks-win32-ia32-$pkg_ver.zip" "Dark Socks-win32-ia32-$pkg_ver"
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