'use strict';

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
    image: `${configuration.application}-rabbitmq`,
    name: `${configuration.application}-rabbitmq`,
    env: {
      RABBITMQ_DEFAULT_USER: 'wolkenkit',
      RABBITMQ_DEFAULT_PASS: sharedKey
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
    networkAlias: 'messagebus',
    ports: {},
    restart: 'on-failure:3'
  };

  if (debug) {
    result.ports[5672] = selectedEnvironment.api.address.port + 32;
    result.ports[15672] = selectedEnvironment.api.address.port + 33;
  }

  if (persistData) {
    result.volumes = [
      `${configuration.application}-rabbitmq-volume:/var/lib/rabbitmq`
    ];
  }

  return result;
};

module.exports = container;
