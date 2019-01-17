'use strict';

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

  const { eventBus } = connections;

  const result = {
    image: 'thenativeweb/wolkenkit-rabbitmq',
    name: `${configuration.application.name}-rabbitmq`,
    env: {
      RABBITMQ_DEFAULT_USER: eventBus.container.amqp.user,
      RABBITMQ_DEFAULT_PASS: eventBus.container.amqp.password
    },
    labels: {
      'wolkenkit-api-host': configuration.api.host.name,
      'wolkenkit-api-port': configuration.api.port,
      'wolkenkit-application': configuration.application.name,
      'wolkenkit-debug': debug,
      'wolkenkit-persist-data': persistData,
      'wolkenkit-shared-key': sharedKey,
      'wolkenkit-type': image().type
    },
    networks: [
      `${configuration.application.name}-network`
    ],
    networkAlias: 'messagebus',
    ports: {
      [eventBus.container.amqp.port]: eventBus.external.amqp.port,
      [eventBus.container.http.port]: eventBus.external.http.port
    },
    restart: 'always'
  };

  if (persistData) {
    result.volumes = [
      `${configuration.application.name}-rabbitmq-volume:/var/lib/rabbitmq`
    ];
  }

  return result;
};

module.exports = container;
