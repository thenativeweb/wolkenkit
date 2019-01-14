'use strict';

const get = require('lodash/get'),
      merge = require('lodash/merge');

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
    dependsOn: [
      `${configuration.application}-node-modules`,
      `${configuration.application}-postgres`,
      `${configuration.application}-rabbitmq`
    ],
    image: `${configuration.application}-flows`,
    name: `${configuration.application}-flows`,
    cmd: `dumb-init node ${debug ? '--inspect=0.0.0.0:9229' : ''} /wolkenkit/app.js`,
    env: {
      APPLICATION: configuration.application,
      COMMANDBUS_URL: `amqp://wolkenkit:${sharedKey}@messagebus:5672`,
      EVENTSTORE_TYPE: 'postgres',
      EVENTSTORE_URL: `pg://wolkenkit:${sharedKey}@eventstore:5432/wolkenkit`,
      FLOWBUS_URL: `amqp://wolkenkit:${sharedKey}@messagebus:5672`,
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
      PROFILING_HOST: selectedEnvironment.api.address.host,
      PROFILING_PORT: 8125,
      STATUS_PORT: 3333,
      STATUS_CORS_ORIGIN: '*'
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
    networkAlias: 'flows',
    ports: {},
    restart: 'on-failure:3',
    volumesFrom: [
      `${configuration.application}-node-modules`
    ]
  };

  if (selectedEnvironment.environmentVariables) {
    result.env = merge({}, result.env, selectedEnvironment.environmentVariables);
  }

  if (debug) {
    result.ports[9229] = selectedEnvironment.api.address.port + 22;
  }

  return result;
};

module.exports = container;
