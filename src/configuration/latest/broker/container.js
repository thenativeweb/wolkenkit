'use strict';

const path = require('path');

const get = require('lodash/get'),
      merge = require('lodash/merge');

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
    dependsOn: [
      `${configuration.application}-core`,
      `${configuration.application}-mongodb`,
      `${configuration.application}-node-modules`,
      `${configuration.application}-postgres`,
      `${configuration.application}-rabbitmq`
    ],
    image: `${configuration.application}-broker`,
    name: `${configuration.application}-broker`,
    cmd: `dumb-init node ${debug ? '--inspect=0.0.0.0:9229' : ''} /wolkenkit/app.js`,
    env: {
      API_CORS_ORIGIN: selectedEnvironment.api.allowAccessFrom,
      API_HOST: selectedEnvironment.api.address.host,
      API_KEYS: get(selectedEnvironment, 'api.certificate') ?
        path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'api.certificate')) :
        '/keys/local.wolkenkit.io',
      API_PORT: 443,
      API_PORT_PUBLIC: selectedEnvironment.api.address.port,
      APPLICATION: configuration.application,
      COMMANDBUS_URL: `amqp://wolkenkit:${sharedKey}@messagebus:5672`,
      EVENTBUS_URL: `amqp://wolkenkit:${sharedKey}@messagebus:5672`,
      EVENTSTORE_TYPE: 'postgres',
      EVENTSTORE_URL: `pg://wolkenkit:${sharedKey}@eventstore:5432/wolkenkit`,
      IDENTITYPROVIDER_CERTIFICATE: get(selectedEnvironment, 'identityProvider.certificate') ?
        path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'identityProvider.certificate')) :
        '/keys/wildcard.wolkenkit.io',
      IDENTITYPROVIDER_NAME: get(selectedEnvironment, 'identityProvider.name', 'auth.wolkenkit.io'),
      LISTSTORE_URL: `mongodb://wolkenkit:${sharedKey}@liststore:27017/wolkenkit`,
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
      PROFILING_HOST: selectedEnvironment.api.address.host,
      PROFILING_PORT: 8125,
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
    networks: [
      `${configuration.application}-network`
    ],
    networkAlias: 'broker',
    ports: {
      443: selectedEnvironment.api.address.port,
      3333: selectedEnvironment.api.address.port + 9
    },
    restart: 'on-failure:3',
    volumesFrom: [
      `${configuration.application}-node-modules`
    ]
  };

  if (selectedEnvironment.environmentVariables) {
    result.env = merge({}, result.env, selectedEnvironment.environmentVariables);
  }

  if (debug) {
    result.ports[9229] = selectedEnvironment.api.address.port + 6;
  }

  return result;
};

module.exports = container;
