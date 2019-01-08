'use strict';

const image = require('./image');

const container = function (options) {
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
  const { configuration, env, sharedKey, persistData, debug } = options;
  /* eslint-enable no-unused-vars */

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
      'wolkenkit-debug': debug,
      'wolkenkit-persist-data': persistData,
      'wolkenkit-shared-key': sharedKey,
      'wolkenkit-type': image().type
    },
    networks: [
      `${configuration.application}-network`
    ],
    networkAlias: 'liststore',
    ports: {
      27017: selectedEnvironment.api.address.port + 2
    },
    restart: 'on-failure:3'
  };

  if (persistData) {
    result.volumes = [
      `${configuration.application}-mongodb-volume:/data/db`
    ];
  }

  return result;
};

module.exports = container;
