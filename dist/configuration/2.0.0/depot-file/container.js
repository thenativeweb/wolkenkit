'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var path = require('path');

var get = require('lodash/get');

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
  var fileStorage = connections.fileStorage;
  var selectedEnvironment = packageJson.environments[environment];
  var result = {
    image: 'thenativeweb/wolkenkit-depot-file',
    name: "".concat(configuration.application.name, "-depot-file"),
    env: {
      IDENTITYPROVIDER_CERTIFICATE: get(selectedEnvironment, 'identityProvider.certificate', '/keys/wildcard.wolkenkit.io'),
      IDENTITYPROVIDER_NAME: get(selectedEnvironment, 'identityProvider.name', 'auth.wolkenkit.io'),
      KEYS: configuration.api.host.certificate === defaults.commands.shared.certificate ? configuration.api.host.certificate : path.join('/', 'wolkenkit', 'app', configuration.api.host.certificate),
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
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
    networkAlias: 'depot-file',
    ports: (0, _defineProperty2.default)({}, fileStorage.container.https.port, fileStorage.external.https.port),
    restart: 'always',
    volumes: ['/blobs']
  };

  if (persistData) {
    result.volumes = ["".concat(configuration.application.name, "-depot-file-volume:/blobs")];
  }

  return result;
};

module.exports = container;