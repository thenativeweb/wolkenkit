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

  const { listStore } = connections;

  const result = {
    image: `${configuration.application.name}-mongodb`,
    name: `${configuration.application.name}-mongodb`,
    env: {
      MONGODB_DATABASE: listStore.container.mongodb.database,
      MONGODB_USER: listStore.container.mongodb.user,
      MONGODB_PASS: listStore.container.mongodb.password
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
    networkAlias: 'liststore',
    ports: {},
    restart: 'on-failure:3',
    volumes: [
      `${volume.name}:/data/db`
    ]
  };

  if (debug) {
    result.ports[listStore.container.mongodb.port] = listStore.external.mongodb.port;
  }

  return result;
};

module.exports = container;
