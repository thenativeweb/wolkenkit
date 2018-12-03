'use strict';

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
    image: "thenativeweb/wolkenkit-depot-file",
    name: "".concat(configuration.application, "-depot-file"),
    env: {
      IDENTITYPROVIDER_CERTIFICATE: get(selectedEnvironment, 'identityProvider.certificate', '/keys/wildcard.wolkenkit.io'),
      IDENTITYPROVIDER_NAME: get(selectedEnvironment, 'identityProvider.name', 'auth.wolkenkit.io'),
      KEYS: get(selectedEnvironment, 'api.certificate', '/keys/local.wolkenkit.io'),
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
      STATUS_PORT: 3333,
      STATUS_CORS_ORIGIN: '*'
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
    networkAlias: 'depot-file',
    ports: {
      443: selectedEnvironment.api.address.port + 1,
      3333: selectedEnvironment.api.address.port + 12
    },
    restart: 'always',
    volumes: ['/blobs']
  };

  if (persistData) {
    result.volumes = ["".concat(configuration.application, "-depot-file-volume:/blobs")];
  }

  return result;
};

module.exports = container;