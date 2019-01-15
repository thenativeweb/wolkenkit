'use strict';

const image = require('./image');

const container = function ({
  configuration,
  env,
  sharedKey,
  persistData,
  dangerouslyExposeHttpPorts,
  debug
}) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }
  if (!sharedKey) {
    throw new Error('Shared key is missing.');
  }
  if (persistData === undefined) {
    throw new Error('Persist data is missing.');
  }
  if (dangerouslyExposeHttpPorts === undefined) {
    throw new Error('Dangerously expose http ports is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
  }

  const selectedEnvironment = configuration.environments[env];

  const result = {
    image: `${configuration.application}-mongodb`,
    name: `${configuration.application}-mongodb`,
    env: {
      MONGODB_DATABASE: 'wolkenkit',
      MONGODB_USER: 'wolkenkit',
      MONGODB_PASS: sharedKey
    },
    labels: {
      'wolkenkit-api-port': selectedEnvironment.api.address.port,
      'wolkenkit-application': configuration.application,
      'wolkenkit-dangerously-expose-http-ports': dangerouslyExposeHttpPorts,
      'wolkenkit-debug': debug,
      'wolkenkit-persist-data': persistData,
      'wolkenkit-shared-key': sharedKey,
      'wolkenkit-type': image().type
    },
    networks: [
      `${configuration.application}-network`
    ],
    networkAlias: 'liststore',
    ports: {},
    restart: 'on-failure:3'
  };

  if (debug) {
    result.ports[27017] = selectedEnvironment.api.address.port + 31;
  }

  if (persistData) {
    result.volumes = [
      `${configuration.application}-mongodb-volume:/data/db`
    ];
  }

  return result;
};

module.exports = container;
