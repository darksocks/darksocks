#!/bin/bash

installServer(){
  if [ ! -d /home/darksocks ];then
    useradd darksocks
    mkdir -p /home/darksocks
    chown -R darksocks:darksocks /home/darksocks
  fi
  cp -rf * /home/darksocks/darksocks/
  if [ ! -f /etc/systemd/system/darksocks.service ];then
    cp -f darksocks.service /etc/systemd/system/
  fi
  mkdir -p /etc/darksocks
  if [ ! -f /etc/darksocks/darksocks.json ];then
    cp -f default-darksocks.json /etc/darksocks/darksocks.json
  fi
  systemctl enable darksocks.service
}

case "$1" in
  -i)
    installServer
    ;;
  *)
    echo "Usage: ./darksocks-install.sh -i"
    ;;
esac