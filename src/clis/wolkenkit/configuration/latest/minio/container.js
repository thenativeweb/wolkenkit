'use strict';

const getVolume = require('./volume'),
      image = require('./image');

const container = function ({
  configuration,
  connections,
  dangerouslyExposeHttpPorts,
  debug,
  secret
}) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!connections) {
    throw new Error('Connections are missing.');
  }
  if (dangerouslyExposeHttpPorts === undefined) {
    throw new Error('Dangerously expose http ports is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
  }
  if (!secret) {
    throw new Error('Secret is missing.');
  }

  const volume = getVolume({ configuration, secret });

  const { s3 } = connections;

  const result = {
    image: `${configuration.application.name}-minio`,
    name: `${configuration.application.name}-minio`,
    cmd: 'server /data',
    env: {
      MINIO_ACCESS_KEY: s3.container.minio.accessKey,
      MINIO_SECRET_KEY: s3.container.minio.secretKey
    },
    labels: {
      'wolkenkit-api-port': configuration.api.port,
      'wolkenkit-application': configuration.application.name,
      'wolkenkit-dangerously-expose-http-ports': dangerouslyExposeHttpPorts,
      'wolkenkit-debug': debug,
      'wolkenkit-secret': secret,
      'wolkenkit-type': image().type
    },
    networks: [
      `${configuration.application.name}-network`
    ],
    networkAlias: 's3',
    ports: {},
    restart: 'on-failure:3',
    volumes: [
      `${volume.name}:/data`
    ]
  };

  if (debug) {
    result.ports[s3.container.minio.port] = s3.external.minio.port;
  }

  return result;
};

module.exports = container;
