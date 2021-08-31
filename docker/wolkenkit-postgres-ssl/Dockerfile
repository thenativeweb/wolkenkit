FROM postgres:13.4-alpine
LABEL maintainer="the native web <hello@thenativeweb.io>"

WORKDIR /app

COPY docker/wolkenkit-postgres-ssl/certificate.pem server.crt
COPY docker/wolkenkit-postgres-ssl/privateKey.pem server.key

RUN chown 0:70 server.key
RUN chmod 640 server.key
