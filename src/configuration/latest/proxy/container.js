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
    dependsOn: [
      `${configuration.application}-broker`
    ],
    image: `${configuration.application}-proxy`,
    name: `${configuration.application}-proxy`,
    env: {
      API_EXTERNAL_HOST: selectedEnvironment.api.address.host,
      API_EXTERNAL_PORT: selectedEnvironment.api.address.port,
      API_CERTIFICATE: get(selectedEnvironment, 'api.certificate') ?
        path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'api.certificate'), 'certificate.pem') :
        '/keys/local.wolkenkit.io/certificate.pem',
      API_PRIVATE_KEY: get(selectedEnvironment, 'api.certificate') ?
        path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'api.certificate'), 'privateKey.pem') :
        '/keys/local.wolkenkit.io/privateKey.pem',
      API_CONTAINER_HOST: 'broker',
      API_CONTAINER_PORT: 80,
      DEPOT_EXTERNAL_HOST: selectedEnvironment.api.address.host,
      DEPOT_EXTERNAL_PORT: selectedEnvironment.api.address.port + 1,
      DEPOT_CERTIFICATE: get(selectedEnvironment, 'api.certificate') ?
        path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'api.certificate'), 'certificate.pem') :
        '/keys/local.wolkenkit.io/certificate.pem',
      DEPOT_PRIVATE_KEY: get(selectedEnvironment, 'api.certificate') ?
        path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'api.certificate'), 'privateKey.pem') :
        '/keys/local.wolkenkit.io/privateKey.pem',
      DEPOT_CONTAINER_HOST: 'depot',
      DEPOT_CONTAINER_PORT: 80
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
    networkAlias: 'proxy',
    ports: {
      [selectedEnvironment.api.address.port]: selectedEnvironment.api.address.port,
      [selectedEnvironment.api.address.port + 1]: selectedEnvironment.api.address.port + 1
    },
    restart: 'on-failure:3'
  };

  return result;
};

module.exports = container;
