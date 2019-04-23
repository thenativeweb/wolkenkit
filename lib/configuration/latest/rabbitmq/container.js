'use strict';

const getVolume = require('./volume'),
      image = require('./image');

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

  const volume = getVolume({ configuration, secret });

  const { eventBus } = connections;

  const result = {
    image: `${configuration.application.name}-rabbitmq`,
    name: `${configuration.application.name}-rabbitmq`,
    env: {
      RABBITMQ_DEFAULT_USER: eventBus.container.amqp.user,
      RABBITMQ_DEFAULT_PASS: eventBus.container.amqp.password
    },
    labels: {
      'wolkenkit-api-port': configuration.api.port,
      'wolkenkit-application': configuration.application.name,
      'wolkenkit-dangerously-expose-http-ports': dangerouslyExposeHttpPorts,
      'wolkenkit-debug': debug,
      'wolkenkit-secret': secret,
      'wolkenkit-type': image().type
    },
    networks: [
      `${configuration.application.name}-network`
    ],
    networkAlias: 'messagebus',
    ports: {},
    restart: 'on-failure:3',
    volumes: [
      `${volume.name}:/var/lib/rabbitmq`
    ]
  };

  if (debug) {
    result.ports[eventBus.container.amqp.port] = eventBus.external.amqp.port;
    result.ports[eventBus.container.http.port] = eventBus.external.http.port;
  }

  return result;
};

module.exports = container;
