'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var path = require('path');

var get = require('lodash/get'),
    merge = require('lodash/merge');

var defaults = require('../../../wolkenkit/defaults.json'),
    image = require('./image');

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
      eventBus = connections.eventBus,
      eventStore = connections.eventStore,
      listStore = connections.listStore,
      api = connections.api,
      debugging = connections.debugging;
  var selectedEnvironment = packageJson.environments[environment];
  var result = {
    dependsOn: ["".concat(configuration.application.name, "-core"), "".concat(configuration.application.name, "-mongodb"), "".concat(configuration.application.name, "-node-modules"), "".concat(configuration.application.name, "-postgres"), "".concat(configuration.application.name, "-rabbitmq")],
    image: "".concat(configuration.application.name, "-broker"),
    name: "".concat(configuration.application.name, "-broker"),
    cmd: "dumb-init node ".concat(debug ? '--inspect=0.0.0.0:9229' : '', " /wolkenkit/app.js"),
    env: {
      API_CORS_ORIGIN: selectedEnvironment.api.allowAccessFrom,
      API_HOST: api.container.https.hostname,
      API_KEYS: configuration.api.host.certificate === defaults.commands.shared.certificate ? configuration.api.host.certificate : path.join('/', 'wolkenkit', 'app', configuration.api.host.certificate),
      API_PORT: api.container.https.port,
      APPLICATION: configuration.application.name,
      COMMANDBUS_URL: "".concat(commandBus.container.amqp.protocol, "://").concat(commandBus.container.amqp.user, ":").concat(commandBus.container.amqp.password, "@").concat(commandBus.container.amqp.hostname, ":").concat(commandBus.container.amqp.port),
      EVENTBUS_URL: "".concat(eventBus.container.amqp.protocol, "://").concat(eventBus.container.amqp.user, ":").concat(eventBus.container.amqp.password, "@").concat(eventBus.container.amqp.hostname, ":").concat(eventBus.container.amqp.port),
      EVENTSTORE_TYPE: eventStore.type,
      EVENTSTORE_URL: "".concat(eventStore.container.pg.protocol, "://").concat(eventStore.container.pg.user, ":").concat(eventStore.container.pg.password, "@").concat(eventStore.container.pg.hostname, ":").concat(eventStore.container.pg.port, "/").concat(eventStore.container.pg.database),
      IDENTITYPROVIDER_CERTIFICATE: get(selectedEnvironment, 'identityProvider.certificate') ? path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'identityProvider.certificate')) : '/keys/wildcard.wolkenkit.io',
      IDENTITYPROVIDER_NAME: get(selectedEnvironment, 'identityProvider.name', 'auth.wolkenkit.io'),
      LISTSTORE_URL: "".concat(listStore.container.mongodb.protocol, "://").concat(listStore.container.mongodb.user, ":").concat(listStore.container.mongodb.password, "@").concat(listStore.container.mongodb.hostname, ":").concat(listStore.container.mongodb.port, "/").concat(listStore.container.mongodb.database),
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
    networkAlias: 'broker',
    ports: (0, _defineProperty2.default)({}, api.container.https.port, api.external.https.port),
    restart: 'on-failure:3',
    volumesFrom: ["".concat(configuration.application.name, "-node-modules")]
  };

  if (selectedEnvironment.environmentVariables) {
    result.env = merge({}, result.env, selectedEnvironment.environmentVariables);
  }

  if (debug) {
    result.ports[9229] = debugging.broker.port;
  }

  return result;
};

module.exports = container;