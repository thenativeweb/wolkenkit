FROM node:10.16.0-alpine
LABEL maintainer="the native web <hello@thenativeweb.io>"

RUN apk update && \
    apk upgrade && \
    apk add git

ADD ./package.json /wolkenkit/

RUN cd /wolkenkit && \
    npm install --production --silent

ADD . /wolkenkit/

# CMD is set programmatically by the wolkenkit CLI.

ONBUILD ADD . /wolkenkit-application/
