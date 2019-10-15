'use strict';

const get = require('lodash/get');

const image = require('./image');

const container = function ({
  configuration,
  connections,
  dangerouslyExposeHttpPorts,
  debug,
  secret
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
  if (!secret) {
    throw new Error('Secret is missing.');
  }

  const { environment, packageJson } = configuration;

  const selectedEnvironment = packageJson.environments[environment];

  return {
    image: `${configuration.application.name}-node-modules`,
    name: `${configuration.application.name}-node-modules`,
    env: {
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development')
    },
    labels: {
      'wolkenkit-api-port': configuration.api.port,
      'wolkenkit-application': configuration.application.name,
      'wolkenkit-dangerously-expose-http-ports': dangerouslyExposeHttpPorts,
      'wolkenkit-debug': debug,
      'wolkenkit-secret': secret,
      'wolkenkit-type': image().type
    },
    volumes: [
      '/wolkenkit/app/node_modules'
    ]
  };
};

module.exports = container;
