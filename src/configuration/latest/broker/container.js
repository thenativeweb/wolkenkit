'use strict';

const path = require('path');

const get = require('lodash/get'),
      merge = require('lodash/merge');

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
  const { commandBus, eventBus, eventStore, listStore, api, debugging } = connections;

  const selectedEnvironment = packageJson.environments[environment];

  const identityProviders = [];

  if (selectedEnvironment.identityProviders) {
    for (const identityProvider of selectedEnvironment.identityProviders) {
      identityProviders.push({
        issuer: identityProvider.issuer,
        certificate: path.posix.join('/', 'wolkenkit', 'app', identityProvider.certificate)
      });
    }
  } else {
    identityProviders.push({
      issuer: 'https://token.invalid',
      certificate: '/keys/wildcard.wolkenkit.io'
    });
  }

  const result = {
    dependsOn: [
      `${configuration.application.name}-core`,
      `${configuration.application.name}-mongodb`,
      `${configuration.application.name}-node-modules`,
      `${configuration.application.name}-postgres`,
      `${configuration.application.name}-rabbitmq`
    ],
    image: `${configuration.application.name}-broker`,
    name: `${configuration.application.name}-broker`,
    cmd: `dumb-init node ${debug ? '--inspect=0.0.0.0:9229' : ''} /wolkenkit/app.js`,
    env: {
      API_CORS_ORIGIN: selectedEnvironment.api.allowAccessFrom,
      API_PORT: api.container.http.port,
      APPLICATION: configuration.application.name,
      COMMANDBUS_URL: `${commandBus.container.amqp.protocol}://${commandBus.container.amqp.user}:${commandBus.container.amqp.password}@${commandBus.container.amqp.hostname}:${commandBus.container.amqp.port}`,
      EVENTBUS_URL: `${eventBus.container.amqp.protocol}://${eventBus.container.amqp.user}:${eventBus.container.amqp.password}@${eventBus.container.amqp.hostname}:${eventBus.container.amqp.port}`,
      EVENTSTORE_TYPE: eventStore.type,
      EVENTSTORE_URL: `${eventStore.container.pg.protocol}://${eventStore.container.pg.user}:${eventStore.container.pg.password}@${eventStore.container.pg.hostname}:${eventStore.container.pg.port}/${eventStore.container.pg.database}`,
      IDENTITYPROVIDERS: identityProviders,
      LISTSTORE_URL: `${listStore.container.mongodb.protocol}://${listStore.container.mongodb.user}:${listStore.container.mongodb.password}@${listStore.container.mongodb.hostname}:${listStore.container.mongodb.port}/${listStore.container.mongodb.database}`,
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
      PROFILING_HOST: configuration.api.host.name,
      PROFILING_PORT: 8125,
      STATUS_PORT: 3333,
      STATUS_CORS_ORIGIN: '*'
    },
    labels: {
      'wolkenkit-api-port': configuration.api.port,
      'wolkenkit-application': configuration.application.name,
      'wolkenkit-dangerously-expose-http-ports': dangerouslyExposeHttpPorts,
      'wolkenkit-debug': debug,
      'wolkenkit-persist-data': persistData,
      'wolkenkit-shared-key': sharedKey,
      'wolkenkit-type': image().type
    },
    networks: [
      `${configuration.application.name}-network`
    ],
    networkAlias: 'broker',
    ports: {},
    restart: 'on-failure:3',
    volumesFrom: [
      `${configuration.application.name}-node-modules`
    ]
  };

  if (selectedEnvironment.environmentVariables) {
    result.env = merge({}, result.env, selectedEnvironment.environmentVariables);
  }

  if (dangerouslyExposeHttpPorts) {
    result.ports[api.container.http.port] = api.external.http.port;
  }

  if (debug) {
    result.ports[9229] = debugging.broker.port;
  }

  return result;
};

module.exports = container;
