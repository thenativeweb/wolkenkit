'use strict';

const image = require('./image');

const container = function ({
  configuration,
  connections,
  dangerouslyExposeHttpPorts,
  debug,
  persistData,
  sharedKey
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
  if (persistData === undefined) {
    throw new Error('Persist data is missing.');
  }
  if (!sharedKey) {
    throw new Error('Shared key is missing.');
  }

  const { eventStore } = connections;

  const result = {
    image: `${configuration.application.name}-postgres`,
    name: `${configuration.application.name}-postgres`,
    env: {
      POSTGRES_DB: eventStore.container.pg.database,
      POSTGRES_USER: eventStore.container.pg.user,
      POSTGRES_PASSWORD: eventStore.container.pg.password
    },
    labels: {
      'wolkenkit-api-port': configuration.api.port,
      'wolkenkit-application': configuration.application.name,
      'wolkenkit-dangerously-expose-http-ports': dangerouslyExposeHttpPorts,
      'wolkenkit-debug': debug,
      'wolkenkit-persist-data': persistData,
      'wolkenkit-shared-key': sharedKey,
      'wolkenkit-type': image().type
    },
    networks: [
      `${configuration.application.name}-network`
    ],
    networkAlias: 'eventstore',
    ports: {
      [eventStore.container.pg.port]: eventStore.external.pg.port
    },
    restart: 'on-failure:3'
  };

  if (persistData) {
    result.volumes = [
      `${configuration.application.name}-postgres-volume:/var/lib/postgresql/data`
    ];
  }

  return result;
};

module.exports = container;
