'use strict';

const path = require('path');

const get = require('lodash/get');

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

  const { environment, packageJson } = configuration;
  const { fileStorage } = connections;

  const selectedEnvironment = packageJson.environments[environment];

  const result = {
    image: `${configuration.application.name}-depot`,
    name: `${configuration.application.name}-depot`,
    env: {
      API_CORS_ORIGIN: selectedEnvironment.fileStorage.allowAccessFrom,
      HTTP_PORT: fileStorage.container.http.port,
      HTTPS_PORT: fileStorage.container.https.port,
      IDENTITYPROVIDER_CERTIFICATE: get(selectedEnvironment, 'identityProvider.certificate') ?
        path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'identityProvider.certificate')) :
        '/keys/wildcard.wolkenkit.io',
      IDENTITYPROVIDER_NAME: get(selectedEnvironment, 'identityProvider.name', 'auth.wolkenkit.io'),
      IS_AUTHORIZED_COMMANDS_ADD_FILE: get(selectedEnvironment, 'fileStorage.isAuthorized.commands.addFile') ?
        get(selectedEnvironment, 'fileStorage.isAuthorized.commands.addFile') :
        { forAuthenticated: true, forPublic: false },
      KEYS: get(selectedEnvironment, 'api.certificate') ?
        path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'api.certificate')) :
        '/keys/local.wolkenkit.io',
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
      STATUS_PORT: 3333,
      STATUS_CORS_ORIGIN: '*',
      PROVIDER_TYPE: 'fileSystem',
      PROVIDER_DIRECTORY: '/blobs'
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
    networkAlias: 'depot',
    ports: {
      [fileStorage.container.https.port]: fileStorage.external.https.port
    },
    restart: 'on-failure:3',
    volumes: [
      '/blobs'
    ]
  };

  if (persistData) {
    result.volumes = [
      `${configuration.application.name}-depot-volume:/blobs`
    ];
  }

  return result;
};

module.exports = container;
