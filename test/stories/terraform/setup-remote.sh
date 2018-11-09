#!/bin/bash

set -e

sudo apt-get update
sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"

sudo apt-get update
sudo apt-get install -y docker-ce

sudo usermod -aG docker $USER

sudo echo '{"hosts":["tcp://0.0.0.0:2376","unix:///var/run/docker.sock"],"tls":true,"tlscacert":"/tmp/.docker/ca.pem","tlscert":"/tmp/.docker/cert.pem","tlskey":"/tmp/.docker/key.pem"}' | sudo tee /etc/docker/daemon.json > /dev/null
sudo mkdir -p /etc/systemd/system/docker.service.d
sudo echo -e "[Service]\nExecStart=\nExecStart=/usr/bin/dockerd" | sudo tee /etc/systemd/system/docker.service.d/override.conf > /dev/null

sudo systemctl daemon-reload
sudo systemctl restart docker.service
