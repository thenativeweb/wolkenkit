'use strict';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var path = require('path');

var defaults = require('../../../wolkenkit/defaults.json'),
    image = require('./image');

var container = function container(_ref) {
  var _ports;

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

  var api = connections.api,
      fileStorage = connections.fileStorage;
  var result = {
    dependsOn: ["".concat(configuration.application.name, "-broker")],
    image: "".concat(configuration.application.name, "-proxy"),
    name: "".concat(configuration.application.name, "-proxy"),
    env: {
      API_EXTERNAL_HOST: api.external.https.hostname,
      API_EXTERNAL_PORT: api.external.https.port,
      API_CERTIFICATE: configuration.api.host.certificate === defaults.commands.shared.certificate ? path.join(configuration.api.host.certificate, 'certificate.pem') : path.join('/', 'wolkenkit', 'app', configuration.api.host.certificate, 'certificate.pem'),
      API_PRIVATE_KEY: configuration.api.host.certificate === defaults.commands.shared.certificate ? path.join(configuration.api.host.certificate, 'privateKey.pem') : path.join('/', 'wolkenkit', 'app', configuration.api.host.certificate, 'privateKey.pem'),
      API_CONTAINER_HOST: api.container.http.hostname,
      API_CONTAINER_PORT: api.container.http.port,
      DEPOT_EXTERNAL_HOST: fileStorage.external.https.hostname,
      DEPOT_EXTERNAL_PORT: fileStorage.external.https.port,
      DEPOT_CERTIFICATE: configuration.api.host.certificate === defaults.commands.shared.certificate ? path.join(configuration.api.host.certificate, 'certificate.pem') : path.join('/', 'wolkenkit', 'app', configuration.api.host.certificate, 'certificate.pem'),
      DEPOT_PRIVATE_KEY: configuration.api.host.certificate === defaults.commands.shared.certificate ? path.join(configuration.api.host.certificate, 'privateKey.pem') : path.join('/', 'wolkenkit', 'app', configuration.api.host.certificate, 'privateKey.pem'),
      DEPOT_CONTAINER_HOST: fileStorage.container.http.hostname,
      DEPOT_CONTAINER_PORT: fileStorage.container.http.port
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
    networkAlias: 'proxy',
    ports: (_ports = {}, (0, _defineProperty2.default)(_ports, api.external.https.port, api.external.https.port), (0, _defineProperty2.default)(_ports, fileStorage.external.https.port, fileStorage.external.https.port), _ports),
    restart: 'on-failure:3'
  };
  return result;
};

module.exports = container;