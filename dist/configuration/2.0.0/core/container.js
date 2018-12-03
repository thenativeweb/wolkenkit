'use strict';

var get = require('lodash/get'),
    merge = require('lodash/merge');

var image = require('./image');

var container = function container(options) {
  if (!options) {
    throw new Error('Options are missing.');
  }

  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }

  if (!options.env) {
    throw new Error('Environment is missing.');
  }

  if (!options.sharedKey) {
    throw new Error('Shared key is missing.');
  }

  if (options.persistData === undefined) {
    throw new Error('Persist data is missing.');
  }

  if (options.debug === undefined) {
    throw new Error('Debug is missing.');
  }
  /* eslint-disable no-unused-vars */


  var configuration = options.configuration,
      env = options.env,
      sharedKey = options.sharedKey,
      persistData = options.persistData,
      debug = options.debug;
  /* eslint-enable no-unused-vars */

  var selectedEnvironment = configuration.environments[env];
  var result = {
    dependsOn: ["".concat(configuration.application, "-mongodb"), "".concat(configuration.application, "-node-modules"), "".concat(configuration.application, "-postgres"), "".concat(configuration.application, "-rabbitmq")],
    image: "".concat(configuration.application, "-core"),
    name: "".concat(configuration.application, "-core"),
    cmd: "dumb-init node ".concat(debug ? '--inspect=0.0.0.0:9229' : '', " /wolkenkit/app.js"),
    env: {
      APPLICATION: configuration.application,
      COMMANDBUS_URL: "amqp://wolkenkit:".concat(sharedKey, "@messagebus:5672"),
      EVENTBUS_URL: "amqp://wolkenkit:".concat(sharedKey, "@messagebus:5672"),
      EVENTSTORE_TYPE: 'postgres',
      EVENTSTORE_URL: "pg://wolkenkit:".concat(sharedKey, "@eventstore:5432/wolkenkit"),
      FLOWBUS_URL: "amqp://wolkenkit:".concat(sharedKey, "@messagebus:5672"),
      NODE_ENV: get(selectedEnvironment, 'node.environment', 'development'),
      PROFILING_HOST: selectedEnvironment.api.address.host,
      PROFILING_PORT: 8125,
      STATUS_PORT: 3333,
      STATUS_CORS_ORIGIN: '*'
    },
    labels: {
      'wolkenkit-api-host': selectedEnvironment.api.address.host,
      'wolkenkit-api-port': selectedEnvironment.api.address.port,
      'wolkenkit-application': configuration.application,
      'wolkenkit-debug': debug,
      'wolkenkit-persist-data': persistData,
      'wolkenkit-shared-key': sharedKey,
      'wolkenkit-type': image().type
    },
    networks: ["".concat(configuration.application, "-network")],
    networkAlias: 'core',
    ports: {
      3333: selectedEnvironment.api.address.port + 10
    },
    restart: 'always',
    volumesFrom: ["".concat(configuration.application, "-node-modules")]
  };

  if (selectedEnvironment.environmentVariables) {
    result.env = merge({}, result.env, selectedEnvironment.environmentVariables);
  }

  if (debug) {
    result.ports[9229] = selectedEnvironment.api.address.port + 7;
  }

  return result;
};

module.exports = container;