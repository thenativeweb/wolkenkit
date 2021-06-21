FROM postgres:13.3-alpine
LABEL maintainer="the native web <hello@thenativeweb.io>"

WORKDIR /app

COPY docker/wolkenkit-postgres-ssl/server.crt server.crt
COPY docker/wolkenkit-postgres-ssl/server.key server.key

RUN chown 0:70 server.key
RUN chmod 640 server.key
