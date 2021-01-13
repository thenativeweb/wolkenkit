const services = {
  microservice: {
    command: {
      hostName: 'command',
      privatePort: 3_000,
      healthPort: 3_001
    },
    commandDispatcher: {
      hostName: 'command-dispatcher',
      privatePort: 3_000,
      healthPort: 3_001
    },
    domain: {
      hostName: 'domain',
      privatePort: 3_000,
      healthPort: 3_001
    },
    domainEvent: {
      hostName: 'domain-event',
      privatePort: 3_000,
      healthPort: 3_001
    },
    aeonstore: {
      hostName: 'aeonstore',
      privatePort: 3_000,
      healthPort: 3_001
    },
    publisher: {
      hostName: 'publisher',
      privatePort: 3_000,
      healthPort: 3_001
    },
    graphql: {
      hostName: 'graphql',
      privatePort: 3_000,
      healthPort: 3_001
    },
    domainEventDispatcher: {
      hostName: 'domain-event-dispatcher',
      privatePort: 3_000,
      healthPort: 3_001
    },
    flow: {
      hostName: 'flow',
      privatePort: 3_000,
      healthPort: 3_001
    },
    replay: {
      hostName: 'replay',
      privatePort: 3_000,
      healthPort: 3_001
    },
    view: {
      hostName: 'view',
      privatePort: 3_000,
      healthPort: 3_001
    },
    notification: {
      hostName: 'notification',
      privatePort: 3_000,
      healthPort: 3_001
    },
    file: {
      hostName: 'file',
      privatePort: 3_000,
      healthPort: 3_001
    },
    traefik: {
      hostName: 'traefik',
      publicPort: 3_000
    }
  },
  singleProcess: {
    main: {
      hostName: 'main',
      publicPort: 3_000,
      privatePort: 3_000,
      healthPort: 3_001
    }
  },
  stores: {
    postgres: {
      hostName: 'postgres',
      privatePort: 5_432,
      userName: 'wolkenkit',
      password: 'please-replace-this',
      database: 'wolkenkit'
    },
    minio: {
      hostName: 'minio',
      privatePort: 9_000,
      accessKey: 'wolkenkit',
      secretKey: 'please-replace-this',
      encryptConnection: false,
      bucketName: 'files'
    }
  }
};

export { services };
