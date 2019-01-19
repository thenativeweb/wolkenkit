'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var path = require('path');

var get = require('lodash/get');

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
  var fileStorage = connections.fileStorage;
  var selectedEnvironment = packageJson.environments[environment];
  var result = {
    image: "".concat(configuration.application.name, "-depot"),
    name: "".concat(configuration.application.name, "-depot"),
    env: {
      API_CORS_ORIGIN: selectedEnvironment.fileStorage.allowAccessFrom,
      HTTP_PORT: fileStorage.container.http.port,
      HTTPS_PORT: fileStorage.container.https.port,
      IDENTITYPROVIDER_CERTIFICATE: get(selectedEnvironment, 'identityProvider.certificate') ? path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'identityProvider.certificate')) : '/keys/wildcard.wolkenkit.io',
      IDENTITYPROVIDER_NAME: get(selectedEnvironment, 'identityProvider.name', 'auth.wolkenkit.io'),
      IS_AUTHORIZED_COMMANDS_ADD_FILE: get(selectedEnvironment, 'fileStorage.isAuthorized.commands.addFile') ? get(selectedEnvironment, 'fileStorage.isAuthorized.commands.addFile') : {
        forAuthenticated: true,
        forPublic: false
      },
      KEYS: get(selectedEnvironment, 'api.certificate') ? path.join('/', 'wolkenkit', 'app', get(selectedEnvironment, 'api.certificate')) : '/keys/local.wolkenkit.io',
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
      STATUS_PORT: 3333,
      STATUS_CORS_ORIGIN: '*',
      PROVIDER_TYPE: 'fileSystem',
      PROVIDER_DIRECTORY: '/blobs'
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
    networkAlias: 'depot',
    ports: (0, _defineProperty2.default)({}, fileStorage.container.https.port, fileStorage.external.https.port),
    restart: 'on-failure:3',
    volumes: ['/blobs']
  };

  if (persistData) {
    result.volumes = ["".concat(configuration.application.name, "-depot-volume:/blobs")];
  }

  return result;
};

module.exports = container;