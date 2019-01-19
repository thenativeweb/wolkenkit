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

  var listStore = connections.listStore;
  var result = {
    image: "".concat(configuration.application.name, "-mongodb"),
    name: "".concat(configuration.application.name, "-mongodb"),
    env: {
      MONGODB_DATABASE: listStore.container.mongodb.database,
      MONGODB_USER: listStore.container.mongodb.user,
      MONGODB_PASS: listStore.container.mongodb.password
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
    networkAlias: 'liststore',
    ports: {},
    restart: 'on-failure:3'
  };

  if (debug) {
    result.ports[listStore.container.mongodb.port] = listStore.external.mongodb.port;
  }

  if (persistData) {
    result.volumes = ["".concat(configuration.application.name, "-mongodb-volume:/data/db")];
  }

  return result;
};

module.exports = container;