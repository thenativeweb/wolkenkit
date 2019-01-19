'use strict';

var get = require('lodash/get'),
    merge = require('lodash/merge');

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

  var environment = configuration.environment,
      packageJson = configuration.packageJson;
  var commandBus = connections.commandBus,
      eventStore = connections.eventStore,
      flowBus = connections.flowBus,
      debugging = connections.debugging;
  var selectedEnvironment = packageJson.environments[environment];
  var result = {
    dependsOn: ["".concat(configuration.application.name, "-node-modules"), "".concat(configuration.application.name, "-postgres"), "".concat(configuration.application.name, "-rabbitmq")],
    image: "".concat(configuration.application.name, "-flows"),
    name: "".concat(configuration.application.name, "-flows"),
    cmd: "dumb-init node ".concat(debug ? '--inspect=0.0.0.0:9229' : '', " /wolkenkit/app.js"),
    env: {
      APPLICATION: configuration.application.name,
      COMMANDBUS_URL: "".concat(commandBus.container.amqp.protocol, "://").concat(commandBus.container.amqp.user, ":").concat(commandBus.container.amqp.password, "@").concat(commandBus.container.amqp.hostname, ":").concat(commandBus.container.amqp.port),
      EVENTSTORE_TYPE: eventStore.type,
      EVENTSTORE_URL: "".concat(eventStore.container.pg.protocol, "://").concat(eventStore.container.pg.user, ":").concat(eventStore.container.pg.password, "@").concat(eventStore.container.pg.hostname, ":").concat(eventStore.container.pg.port, "/").concat(eventStore.container.pg.database),
      FLOWBUS_URL: "".concat(flowBus.container.amqp.protocol, "://").concat(flowBus.container.amqp.user, ":").concat(flowBus.container.amqp.password, "@").concat(flowBus.container.amqp.hostname, ":").concat(flowBus.container.amqp.port),
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
      PROFILING_HOST: configuration.api.host.name,
      PROFILING_PORT: 8125,
      STATUS_PORT: 3333,
      STATUS_CORS_ORIGIN: '*'
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
    networks: ["".concat(configuration.application.name, "-network")],
    networkAlias: 'flows',
    ports: {},
    restart: 'always',
    volumesFrom: ["".concat(configuration.application.name, "-node-modules")]
  };

  if (selectedEnvironment.environmentVariables) {
    result.env = merge({}, result.env, selectedEnvironment.environmentVariables);
  }

  if (debug) {
    result.ports[9229] = debugging.flows.port;
  }

  return result;
};

module.exports = container;