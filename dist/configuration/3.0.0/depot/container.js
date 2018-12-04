'use strict';

var path = require('path');

var get = require('lodash/get');

var image = require('./image');

var container = function container(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }

  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }

  if (!options.env) {
    throw new Error('Environment is missing.');
  }

  if (!options.sharedKey) {
    throw new Error('Shared key is missing.');
  }

  if (options.persistData === undefined) {
    throw new Error('Persist data is missing.');
  }

  if (options.debug === undefined) {
    throw new Error('Debug is missing.');
  }
  /* eslint-disable no-unused-vars */


  var configuration = options.configuration,
      env = options.env,
      sharedKey = options.sharedKey,
      persistData = options.persistData,
      debug = options.debug;
  /* eslint-enable no-unused-vars */

  var selectedEnvironment = configuration.environments[env];
  var result = {
    image: "".concat(configuration.application, "-depot"),
    name: "".concat(configuration.application, "-depot"),
    env: {
      API_CORS_ORIGIN: get(selectedEnvironment, 'fileStorage.allowAccessFrom'),
      HTTP_PORT: 80,
      HTTPS_PORT: 443,
      IDENTITYPROVIDER_CERTIFICATE: get(selectedEnvironment, 'identityProvider.certificate') ? path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'identityProvider.certificate')) : '/keys/wildcard.wolkenkit.io',
      IDENTITYPROVIDER_NAME: get(selectedEnvironment, 'identityProvider.name', 'auth.wolkenkit.io'),
      IS_AUTHORIZED_COMMANDS_ADD_FILE: get(selectedEnvironment, 'fileStorage.isAuthorized.commands.addFile') ? get(selectedEnvironment, 'fileStorage.isAuthorized.commands.addFile') : {
        forAuthenticated: true,
        forPublic: false
      },
      KEYS: get(selectedEnvironment, 'api.certificate') ? path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'api.certificate')) : '/keys/local.wolkenkit.io',
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
      STATUS_PORT: 3333,
      STATUS_CORS_ORIGIN: '*',
      PROVIDER_TYPE: 'fileSystem',
      PROVIDER_DIRECTORY: '/blobs'
    },
    labels: {
      'wolkenkit-api-host': selectedEnvironment.api.address.host,
      'wolkenkit-api-port': selectedEnvironment.api.address.port,
      'wolkenkit-application': configuration.application,
      'wolkenkit-debug': debug,
      'wolkenkit-persist-data': persistData,
      'wolkenkit-shared-key': sharedKey,
      'wolkenkit-type': image().type
    },
    networks: ["".concat(configuration.application, "-network")],
    networkAlias: 'depot',
    ports: {
      443: selectedEnvironment.api.address.port + 1,
      3333: selectedEnvironment.api.address.port + 12
    },
    restart: 'on-failure:3',
    volumes: ['/blobs']
  };

  if (persistData) {
    result.volumes = ["".concat(configuration.application, "-depot-volume:/blobs")];
  }

  return result;
};

module.exports = container;