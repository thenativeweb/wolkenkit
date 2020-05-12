import { versions } from '../../../../versions';

const getSingleProcessPostgresManifest = function ({ appName }: {
  appName: string;
}): string {
  const ports = {
    public: 3000,
    private: 3000,
    health: 3001
  };

  const postgresOptions = {
    userName: 'wolkenkit',
    password: 'please-replace-this',
    database: 'wolkenkit',
    port: 5432
  };

  const lockStoreType = 'Postgres';
  const lockStoreOptions = JSON.stringify({
    hostName: 'postgres',
    port: postgresOptions.port,
    userName: postgresOptions.userName,
    password: postgresOptions.password,
    database: postgresOptions.database,
    tableNames: {
      locks: 'locks'
    }
  });

  const domainEventStoreType = 'Postgres';
  const domainEventStoreOptions = JSON.stringify({
    hostName: 'postgres',
    port: postgresOptions.port,
    userName: postgresOptions.userName,
    password: postgresOptions.password,
    database: postgresOptions.database,
    tableNames: {
      domainEvents: 'domainevents',
      snapshots: 'snapshots'
    }
  });

  const snapshotStrategy = JSON.stringify({
    name: 'lowest',
    configuration: {
      revisionLimit: 100,
      durationLimit: 500
    }
  });

  const identityProviders = JSON.stringify([]);

  return `
    version: '${versions.infrastructure['docker-compose']}'

    services:
      main:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/singleProcess/processes/main/app.js'
        environment:
          APPLICATION_DIRECTORY: '/app'
          HTTP_API: true
          GRAPHQL_API: '{"enableIntegratedClient":false}'
          COMMAND_QUEUE_RENEW_INTERVAL: ${5_000}
          CONCURRENT_COMMANDS: ${100}
          CORS_ORIGIN: '*'
          DOMAIN_EVENT_STORE_OPTIONS: '${domainEventStoreOptions}'
          DOMAIN_EVENT_STORE_TYPE: '${domainEventStoreType}'
          HEALTH_PORT: ${ports.health}
          IDENTITY_PROVIDERS: '${identityProviders}'
          LOCK_STORE_OPTIONS: '${lockStoreOptions}'
          LOCK_STORE_TYPE: '${lockStoreType}'
          LOG_LEVEL: 'debug'
          PORT: ${ports.private}
          SNAPSHOT_STRATEGY: '${snapshotStrategy}'
        image: '${appName}'
        init: true
        ports:
          - '${ports.public}:${ports.private}'
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${ports.health}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      postgres:
        image: 'postgres:${versions.dockerImages.postgres}'
        environment:
          POSTGRES_DB: '${postgresOptions.database}'
          POSTGRES_USER: '${postgresOptions.userName}'
          POSTGRES_PASSWORD: '${postgresOptions.password}'
          PGDATA: '/var/lib/postgresql/data'
        restart: 'always'
        volumes:
          - 'postgres:/var/lib/postgresql/data'

    volumes:
      postgres:
  `;
};

export {
  getSingleProcessPostgresManifest
};
