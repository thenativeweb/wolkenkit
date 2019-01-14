'use strict';

const path = require('path');

const get = require('lodash/get');

const image = require('./image');

const container = function ({
  configuration,
  env,
  sharedKey,
  persistData,
  dangerouslyExposeHttpPort,
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
  if (dangerouslyExposeHttpPort === undefined) {
    throw new Error('Dangerously expose http port is missing.');
  }
  if (debug === undefined) {
    throw new Error('Debug is missing.');
  }

  const selectedEnvironment = configuration.environments[env];

  const result = {
    image: `${configuration.application}-depot`,
    name: `${configuration.application}-depot`,
    env: {
      API_CORS_ORIGIN: get(selectedEnvironment, 'fileStorage.allowAccessFrom'),
      HTTP_PORT: 80,
      IDENTITYPROVIDER_CERTIFICATE: get(selectedEnvironment, 'identityProvider.certificate') ?
        path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'identityProvider.certificate')) :
        '/keys/wildcard.wolkenkit.io',
      IDENTITYPROVIDER_NAME: get(selectedEnvironment, 'identityProvider.name', 'auth.wolkenkit.io'),
      IS_AUTHORIZED_COMMANDS_ADD_FILE: get(selectedEnvironment, 'fileStorage.isAuthorized.commands.addFile') ?
        get(selectedEnvironment, 'fileStorage.isAuthorized.commands.addFile') :
        { forAuthenticated: true, forPublic: false },
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
      STATUS_PORT: 3333,
      STATUS_CORS_ORIGIN: '*',
      PROVIDER_TYPE: 'fileSystem',
      PROVIDER_DIRECTORY: '/blobs'
    },
    labels: {
      'wolkenkit-api-port': selectedEnvironment.api.address.port,
      'wolkenkit-application': configuration.application,
      'wolkenkit-dangerously-expose-http-port': dangerouslyExposeHttpPort,
      'wolkenkit-debug': debug,
      'wolkenkit-persist-data': persistData,
      'wolkenkit-shared-key': sharedKey,
      'wolkenkit-type': image().type
    },
    networks: [
      `${configuration.application}-network`
    ],
    networkAlias: 'depot',
    ports: {},
    restart: 'on-failure:3',
    volumes: [
      '/blobs'
    ]
  };

  if (dangerouslyExposeHttpPort) {
    result.ports[80] = selectedEnvironment.api.address.port + 11;
  }

  if (persistData) {
    result.volumes = [
      `${configuration.application}-depot-volume:/blobs`
    ];
  }

  return result;
};

module.exports = container;
