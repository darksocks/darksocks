#!/bin/bash
##############################
#####Setting Environments#####
echo "Setting Environments"
set -e
export cpwd=`pwd`
export LD_LIBRARY_PATH=/usr/local/lib:/usr/lib
export PATH=$PATH:$GOPATH/bin:$HOME/bin:$GOROOT/bin
output=build


#### Package ####
srv_name=darksocks
srv_ver=0.1.0
srv_out=$output/$srv_name
rm -rf $srv_out
mkdir -p $srv_out
##build normal
echo "Build $srv_name normal executor..."
go build -o $srv_out/$srv_name github.com/darksocks/darksocks
cp -f darksocks-install.sh $srv_out
cp -f cert.sh $srv_out
cp -f darksocks.service $srv_out
cp -f default-darksocks.json $srv_out
cp -f gfwlist.txt $srv_out
cp -f abp.js $srv_out
cp -f networksetup-osx.sh $srv_out

###
cd $output
rm -f $srv_name-$srv_ver-`uname`.zip
zip -r $srv_name-$srv_ver-`uname`.zip $srv_name
cd ../
echo "Package $srv_name done..."