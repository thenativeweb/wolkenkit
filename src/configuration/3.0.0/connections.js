'use strict';

const connections = async function ({
  configuration,
  sharedKey
}) {
  if (!configuration) {
    throw new Error('Configuration is missing');
  }
  if (!sharedKey) {
    throw new Error('Shared key is missing');
  }

  const result = {
    api: {
      container: {
        https: {
          hostname: 'broker',
          port: 443
        }
      },
      external: {
        https: {
          hostname: configuration.api.host.name,
          port: configuration.api.port
        }
      }
    },
    fileStorage: {
      container: {
        http: {
          hostname: 'depot',
          port: 80
        },
        https: {
          hostname: 'depot',
          port: 443
        }
      },
      external: {
        https: {
          hostname: configuration.api.host.name,
          port: configuration.api.port + 1
        }
      }
    },
    debugging: {
      broker: {
        port: configuration.api.port + 6
      },
      core: {
        port: configuration.api.port + 7
      },
      flows: {
        port: configuration.api.port + 8
      }
    },
    eventStore: {
      type: 'postgres',
      container: {
        pg: {
          protocol: 'pg',
          user: 'wolkenkit',
          password: sharedKey,
          database: 'wolkenkit',
          hostname: 'eventstore',
          port: 5432
        }
      },
      external: {
        pg: {
          protocol: 'pg',
          user: 'wolkenkit',
          password: sharedKey,
          database: 'wolkenkit',
          hostname: configuration.api.host.name,
          port: configuration.api.port + 3
        }
      }
    },
    listStore: {
      type: 'mongodb',
      container: {
        mongodb: {
          protocol: 'mongodb',
          user: 'wolkenkit',
          password: sharedKey,
          database: 'wolkenkit',
          hostname: 'liststore',
          port: 27017
        }
      },
      external: {
        mongodb: {
          protocol: 'mongodb',
          user: 'wolkenkit',
          password: sharedKey,
          database: 'wolkenkit',
          hostname: configuration.api.host.name,
          port: configuration.api.port + 2
        }
      }
    },
    commandBus: {
      type: 'rabbitmq',
      container: {
        amqp: {
          protocol: 'amqp',
          user: 'wolkenkit',
          password: sharedKey,
          hostname: 'messagebus',
          port: 5672
        },
        http: {
          port: 15672
        }
      },
      external: {
        amqp: {
          port: configuration.api.port + 4
        },
        http: {
          port: configuration.api.port + 5
        }
      }
    },
    eventBus: {
      type: 'rabbitmq',
      container: {
        amqp: {
          protocol: 'amqp',
          user: 'wolkenkit',
          password: sharedKey,
          hostname: 'messagebus',
          port: 5672
        },
        http: {
          port: 15672
        }
      },
      external: {
        amqp: {
          port: configuration.api.port + 4
        },
        http: {
          port: configuration.api.port + 5
        }
      }
    },
    flowBus: {
      type: 'rabbitmq',
      container: {
        amqp: {
          protocol: 'amqp',
          user: 'wolkenkit',
          password: sharedKey,
          hostname: 'messagebus',
          port: 5672
        },
        http: {
          port: 15672
        }
      },
      external: {
        amqp: {
          port: configuration.api.port + 4
        },
        http: {
          port: configuration.api.port + 5
        }
      }
    }
  };

  return result;
};

module.exports = connections;
