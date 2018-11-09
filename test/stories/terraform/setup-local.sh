#!/bin/bash

set -e

PUBLIC_IP=$1

mkdir -p ./.docker/$PUBLIC_IP

# Create the CA key and certificate
openssl req \
  -subj "/C=DE/ST=Baden-Wuerttemberg/L=Riegel am Kaiserstuhl/O=the native web/OU=IT/CN=localhost/emailAddress=hello@thenativeweb.io" \
  -extensions v3_ca \
  -nodes \
  -x509 \
  -newkey rsa:4096 \
  -keyout "./.docker/$PUBLIC_IP/ca-key.pem" \
  -out "./.docker/$PUBLIC_IP/ca.pem" \
  -days 30

# Create the server key and certificate
openssl req \
  -new \
  -subj "/C=DE/ST=Baden-Wuerttemberg/L=Riegel am Kaiserstuhl/O=the native web/OU=IT/CN=localhost/emailAddress=hello@thenativeweb.io" \
  -nodes \
  -newkey rsa:4096 \
  -keyout "./.docker/$PUBLIC_IP/key.pem" \
  -out "./.docker/$PUBLIC_IP/csr.pem"

echo "subjectAltName = IP:$PUBLIC_IP" > ./.docker/$PUBLIC_IP/extfile.cnf

SERIAL=$(uuidgen | shasum --algorithm 256 | tr -d ' -\n') && \
  openssl x509 \
    -req \
    -days 365 \
    -in "./.docker/$PUBLIC_IP/csr.pem" \
    -CA "./.docker/$PUBLIC_IP/ca.pem" \
    -CAkey "./.docker/$PUBLIC_IP/ca-key.pem" \
    -set_serial 0x$SERIAL \
    -out "./.docker/$PUBLIC_IP/cert.pem" \
    -extfile "./.docker/$PUBLIC_IP/extfile.cnf" \
    -sha512

rm ./.docker/$PUBLIC_IP/csr.pem
rm ./.docker/$PUBLIC_IP/ca-key.pem
rm ./.docker/$PUBLIC_IP/extfile.cnf
