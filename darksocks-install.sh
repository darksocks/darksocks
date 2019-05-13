#!/bin/bash

cert_host=$2
if [ "$cert_host" = "" ];then
  cert_host=darksocks.org
fi

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
  if [ ! -f /etc/darksocks/dsuser.json ];then
    cp -f dsuser.json /etc/darksocks/dsuser.json
  fi
  if [ ! -f /etc/darksocks/dscert.crt ];then
    /home/darksocks/darksocks/cert.sh /etc/darksocks/ $cert_host
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