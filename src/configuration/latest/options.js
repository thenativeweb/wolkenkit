'use strict';

const path = require('path');

const get = require('lodash/get');

const getOptions = async function ({ configuration, sharedKey }) {
  if (!configuration) {
    throw new Error('Configuration is missing');
  }
  if (!sharedKey) {
    throw new Error('Shared key is missing');
  }

  const options = {
    application: {
      name: configuration.application.name
    },
    broker: {
      api: {
        port: 80,
        allowAccessFrom: configuration.api.allowAccessFrom
      },
      profiling: {
        hostname: configuration.api.host.name,
        port: 8125
      },
      status: {
        port: 3333,
        allowAccessFrom: '*'
      }
    },
    core: {
      commandBusConcurrency: 256,
      profiling: {
        hostname: configuration.api.host.name,
        port: 8125
      },
      status: {
        port: 3333,
        allowAccessFrom: '*'
      }
    },
    depot: {
      allowAccessFrom: get(configuration, 'fileStorage.allowAccessFrom', '*'),
      isAuthorized: get(configuration, 'fileStorage.isAuthorized.commands.addFile') ?
        get(configuration, 'fileStorage.isAuthorized.commands.addFile') :
        { forAuthenticated: true, forPublic: false },
      provider: {
        type: 'fileSystem',
        directory: '/blobs'
      },
      status: {
        port: 3333,
        allowAccessFrom: '*'
      }
    },
    flows: {
      profiling: {
        hostname: configuration.api.host.name,
        port: 8125
      },
      status: {
        port: 3333,
        allowAccessFrom: '*'
      }
    },
    eventStore: {
      type: 'postgres',
      protocol: 'pq',
      user: 'wolkenkit',
      password: sharedKey,
      database: 'wolkenkit',
      hostname: 'eventstore',
      port: 5432
    },
    listStore: {
      protocol: 'mongodb',
      user: 'wolkenkit',
      password: sharedKey,
      database: 'wolkenkit',
      hostname: 'liststore',
      port: 27017
    },
    commandBus: {
      protocol: 'amqp',
      user: 'wolkenkit',
      password: sharedKey,
      hostname: 'messagebus',
      port: 5672
    },
    eventBus: {
      protocol: 'amqp',
      user: 'wolkenkit',
      password: sharedKey,
      hostname: 'messagebus',
      port: 5672
    },
    flowBus: {
      protocol: 'amqp',
      user: 'wolkenkit',
      password: sharedKey,
      hostname: 'messagebus',
      port: 5672
    },
    proxy: {
      api: {
        external: {
          hostname: configuration.api.host.name,
          port: configuration.api.port
        },
        certificate: get(configuration, 'api.certificate') ?
          path.join('/', 'wolkenkit', 'app', get(configuration, 'api.certificate'), 'certificate.pem') :
          '/keys/local.wolkenkit.io/certificate.pem',
        privateKey: get(configuration, 'api.certificate') ?
          path.join('/', 'wolkenkit', 'app', get(configuration, 'api.certificate'), 'privateKey.pem') :
          '/keys/local.wolkenkit.io/privateKey.pem',
        container: {
          hostname: 'broker',
          port: 80
        }
      },
      depot: {
        external: {
          hostname: configuration.api.host.name,
          port: configuration.api.port + 1
        },
        certificate: get(configuration, 'api.certificate') ?
          path.join('/', 'wolkenkit', 'app', get(configuration, 'api.certificate'), 'certificate.pem') :
          '/keys/local.wolkenkit.io/certificate.pem',
        privateKey: get(configuration, 'api.certificate') ?
          path.join('/', 'wolkenkit', 'app', get(configuration, 'api.certificate'), 'privateKey.pem') :
          '/keys/local.wolkenkit.io/privateKey.pem',
        container: {
          hostname: 'depot',
          port: 80
        }
      }
    },
    nodeModules: {},
    node: {
      environment: get(configuration, 'node.environment', 'development')
    },
    identityProvider: {
      issuer: get(configuration, 'identityProvider.issuer', 'auth.wolkenkit.io'),
      certificate: get(configuration, 'identityProvider.certificate') ?
        path.join('/', 'wolkenkit', 'app', get(configuration, 'identityProvider.certificate')) :
        '/keys/wildcard.wolkenkit.io'
    }
  };

  return options;
};

module.exports = getOptions;
