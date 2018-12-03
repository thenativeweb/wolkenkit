'use strict';

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
    image: "thenativeweb/wolkenkit-rabbitmq",
    name: "".concat(configuration.application, "-rabbitmq"),
    env: {
      RABBITMQ_DEFAULT_USER: 'wolkenkit',
      RABBITMQ_DEFAULT_PASS: sharedKey
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
    networkAlias: 'messagebus',
    ports: {
      5672: selectedEnvironment.api.address.port + 4,
      15672: selectedEnvironment.api.address.port + 5
    },
    restart: 'always'
  };

  if (persistData) {
    result.volumes = ["".concat(configuration.application, "-rabbitmq-volume:/var/lib/rabbitmq")];
  }

  return result;
};

module.exports = container;