t#!/bin/bash

sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

sudo apt-get update
sudo apt-get install -y docker-ce

sudo usermod -aG docker $USER

sudo sed -i -e 's/-H fd:\/\//-H=tcp:\/\/0\.0\.0\.0:2376 -H=unix:\/\/\/var\/run\/docker.sock --tlsverify --tlscacert=\/tmp\/\.docker\/ca\.pem --tlscert=\/tmp\/\.docker\/cert\.pem --tlskey=\/tmp\/\.docker\/key\.pem/g' /lib/systemd/system/docker.service
sudo systemctl daemon-reload
sudo service docker restart
