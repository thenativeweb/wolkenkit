'use strict';

const path = require('path');

const get = require('lodash/get');

const defaults = require('../../../wolkenkit/defaults.json'),
      image = require('./image');

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

  const { environment, packageJson } = configuration;
  const { fileStorage } = connections;

  const selectedEnvironment = packageJson.environments[environment];

  const result = {
    image: 'thenativeweb/wolkenkit-depot-file',
    name: `${configuration.application.name}-depot-file`,
    env: {
      IDENTITYPROVIDER_CERTIFICATE: get(selectedEnvironment, 'identityProvider.certificate', '/keys/wildcard.wolkenkit.io'),
      IDENTITYPROVIDER_NAME: get(selectedEnvironment, 'identityProvider.name', 'auth.wolkenkit.io'),
      KEYS: configuration.api.host.certificate === defaults.commands.shared.certificate ?
        configuration.api.host.certificate :
        path.join('/', 'wolkenkit', 'app', configuration.api.host.certificate),
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
      STATUS_PORT: 3333,
      STATUS_CORS_ORIGIN: '*'
    },
    labels: {
      'wolkenkit-api-host': configuration.api.host.name,
      'wolkenkit-api-port': configuration.api.port,
      'wolkenkit-application': configuration.application.name,
      'wolkenkit-debug': debug,
      'wolkenkit-persist-data': persistData,
      'wolkenkit-shared-key': sharedKey,
      'wolkenkit-type': image().type
    },
    networks: [
      `${configuration.application.name}-network`
    ],
    networkAlias: 'depot-file',
    ports: {
      [fileStorage.container.https.port]: fileStorage.external.https.port
    },
    restart: 'always',
    volumes: [
      '/blobs'
    ]
  };

  if (persistData) {
    result.volumes = [
      `${configuration.application.name}-depot-file-volume:/blobs`
    ];
  }

  return result;
};

module.exports = container;
