#!/bin/bash
openssl req -x509 -nodes -days 365 -newkey rsa:4096 -keyout $1"dscert.key" -out $1"dscert.crt" -subj "/C=TG/ST=TG/L=TG/O=Dark Socket/OU=Dark Socket/CN=$2"