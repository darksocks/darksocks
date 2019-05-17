#!/bin/bash
set -e
pkg_ver=0.1.0
pkg_osx(){
    rm -rf dist/
    rm -rf out/darksocks-darwin-x64-$pkg_ver
    rm -rf darksocks
    7z x ../build/darksocks-$pkg_ver-Darwin.zip
    npm run pack-osx
    cd out
    # plutil -insert LSUIElement -bool true darksocks-darwin-x64/darksocks.app/Contents/Info.plist
    mv Darksocks-darwin-x64 Darksocks-darwin-x64-$pkg_ver
    7z a -r Darksocks-darwin-x64-$pkg_ver.zip Darksocks-darwin-x64-$pkg_ver -x!*.ts -x!*.map -x!*.h -x!*.m -x!*.md -x!*.scss
    cd ../
}
pkg_linux(){
    rm -rf dist/
    rm -rf out/darksocks-linux-x64-$pkg_ver
    rm -rf darksocks
    7z x ../build/darksocks-$pkg_ver-Linux.zip
    npm run pack-linux
    cd out
    mv darksocks-linux-x64 darksocks-linux-x64-$pkg_ver
    7z a -r darksocks-linux-x64-$pkg_ver.zip darksocks-linux-x64-$pkg_ver
    cd ../
}
pkg_win(){
    rm -rf dist/
    rm -rf out/darksocks-win32-ia32-$pkg_ver
    rm -rf darksocks
    7z x ../build/darksocks-$pkg_ver-Win-386.zip
    npm run pack-win
    cd out
    mv darksocks-win32-ia32 darksocks-win32-ia32-$pkg_ver
    7z a -r darksocks-win32-ia32-$pkg_ver.zip darksocks-win32-ia32-$pkg_ver -x!*.ts -x!*.map -x!*.h -x!*.m -x!*.md -x!*.scss
    cd ../
}
pkg_win64(){
    rm -rf dist/
    rm -rf out/darksocks-win32-x64-$pkg_ver
    rm -rf darksocks
    7z x ../build/darksocks-$pkg_ver-Win-amd64.zip
    npm run pack-win64
    cd out
    mv darksocks-win32-x64 darksocks-win32-x64-$pkg_ver
    7z a -r darksocks-win32-x64-$pkg_ver.zip darksocks-win32-x64-$pkg_ver -x!*.ts -x!*.map -x!*.h -x!*.m -x!*.md -x!*.scss
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
win64)
    pkg_win64
;;
all)
    rm -rf out
    pkg_osx
    pkg_win
;;
esac