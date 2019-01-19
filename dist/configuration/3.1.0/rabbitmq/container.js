'use strict';

var image = require('./image');

var container = function container(_ref) {
  var configuration = _ref.configuration,
      connections = _ref.connections,
      dangerouslyExposeHttpPorts = _ref.dangerouslyExposeHttpPorts,
      debug = _ref.debug,
      persistData = _ref.persistData,
      sharedKey = _ref.sharedKey;

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

  var eventBus = connections.eventBus;
  var result = {
    image: "".concat(configuration.application.name, "-rabbitmq"),
    name: "".concat(configuration.application.name, "-rabbitmq"),
    env: {
      RABBITMQ_DEFAULT_USER: eventBus.container.amqp.user,
      RABBITMQ_DEFAULT_PASS: eventBus.container.amqp.password
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
    networks: ["".concat(configuration.application.name, "-network")],
    networkAlias: 'messagebus',
    ports: {},
    restart: 'on-failure:3'
  };

  if (debug) {
    result.ports[eventBus.container.amqp.port] = eventBus.external.amqp.port;
    result.ports[eventBus.container.http.port] = eventBus.external.http.port;
  }

  if (persistData) {
    result.volumes = ["".concat(configuration.application.name, "-rabbitmq-volume:/var/lib/rabbitmq")];
  }

  return result;
};

module.exports = container;