import { versions } from '../../../../versions';

const getMicroservicePostgresManifest = function ({ appName }: {
  appName: string;
}): string {
  const ports = {
    public: {
      command: 3000,
      domainEvents: 3001,
      graphql: 3002
    },
    private: {
      command: 3000,
      dispatcher: 3000,
      domainEvents: 3000,
      aeonstore: 3000,
      publisher: 3000,
      graphql: 3000
    },
    health: {
      command: 3001,
      dispatcher: 3001,
      domain: 3001,
      domainEvents: 3001,
      aeonstore: 3001,
      publisher: 3001,
      graphql: 3001
    }
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

  const priorityQueueStoreType = 'InMemory';
  const priorityQueueStoreOptions = JSON.stringify({
    expirationTime: 30000
  });

  const pubSubType = 'InMemory';
  const pubSubOptions = JSON.stringify({
    channel: 'newCommand',
    subscriber: {},
    publisher: {}
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
      command:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/command/app.js'
        environment:
          APPLICATION_DIRECTORY: '/app'
          COMMAND_CORS_ORIGIN: '*'
          DISPATCHER_PROTOCOL: 'http'
          DISPATCHER_HOST_NAME: 'dispatcher'
          DISPATCHER_PORT: ${ports.private.dispatcher}
          DISPATCHER_RETRIES: ${5}
          HEALTH_CORS_ORIGIN: '*'
          IDENTITY_PROVIDERS: '${identityProviders}'
          PORT: ${ports.private.command}
          HEALTH_PORT: ${ports.health.command}
        image: '${appName}'
        init: true
        ports:
          - '${ports.public.command}:${ports.private.command}'
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${ports.health.command}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      dispatcher:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/dispatcher/app.js'
        environment:
          APPLICATION_DIRECTORY: '/app'
          PRIORITY_QUEUE_STORE_TYPE: '${priorityQueueStoreType}'
          PRIORITY_QUEUE_STORE_OPTIONS: '${priorityQueueStoreOptions}'
          PUB_SUB_TYPE: '${pubSubType}'
          PUB_SUB_OPTIONS: '${pubSubOptions}'
          AWAIT_COMMAND_CORS_ORIGIN: '*'
          HANDLE_COMMAND_CORS_ORIGIN: '*'
          HEALTH_CORS_ORIGIN: '*'
          PORT: ${ports.private.dispatcher}
          HEALTH_PORT: ${ports.health.dispatcher}
          MISSED_COMMAND_RECOVERY_INTERVAL: ${5000}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${ports.health.dispatcher}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      domain:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/domain/app.js'
        environment:
          APPLICATION_DIRECTORY: '/app'
          DISPATCHER_PROTOCOL: 'http'
          DISPATCHER_HOST_NAME: 'dispatcher'
          DISPATCHER_PORT: ${ports.private.dispatcher}
          DISPATCHER_RENEW_INTERVAL: ${5000}
          DISPATCHER_ACKNOWLEDGE_RETRIES: ${5}
          PUBLISHER_PROTOCOL: 'http'
          PUBLISHER_HOST_NAME: 'publisher'
          PUBLISHER_PORT: ${ports.private.publisher}
          AEONSTORE_PROTOCOL: 'http'
          AEONSTORE_HOST_NAME: 'aeonstore'
          AEONSTORE_PORT: ${ports.private.aeonstore}
          LOCK_STORE_OPTIONS: '${lockStoreOptions}'
          LOCK_STORE_TYPE: '${lockStoreType}'
          HEALTH_CORS_ORIGIN: '*'
          HEALTH_PORT: ${ports.health.domain}
          CONCURRENT_COMMAND: ${1}
          SNAPSHOT_STRATEGY: '${snapshotStrategy}'
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${ports.health.domain}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      domainEvent:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/domainEvent/app.js'
        environment:
          APPLICATION_DIRECTORY: '/app'
          DOMAIN_EVENT_CORS_ORIGIN: '*'
          DOMAIN_EVENT_STORE_OPTIONS: '${domainEventStoreOptions}'
          DOMAIN_EVENT_STORE_TYPE: '${domainEventStoreType}'
          HEALTH_CORS_ORIGIN: '*'
          IDENTITY_PROVIDERS: '${identityProviders}'
          PORT: ${ports.private.domainEvents}
          HEALTH_PORT: ${ports.health.domainEvents}
          SUBSCRIBE_MESSAGES_PROTOCOL: 'http'
          SUBSCRIBE_MESSAGES_HOST_NAME: 'publisher'
          SUBSCRIBE_MESSAGES_PORT: ${ports.private.publisher}
          SNAPSHOT_STRATEGY: '${snapshotStrategy}'
        image: '${appName}'
        init: true
        ports:
          - '${ports.public.domainEvents}:${ports.private.domainEvents}'
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${ports.health.domainEvents}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      aeonstore:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/domainEventStore/app.js'
        environment:
          DOMAIN_EVENT_STORE_TYPE: '${domainEventStoreType}'
          DOMAIN_EVENT_STORE_OPTIONS: '${domainEventStoreOptions}'
          QUERY_DOMAIN_EVENT_CORS_ORIGIN: '*'
          WRITE_DOMAIN_EVENT_CORS_ORIGIN: '*'
          HEALTH_CORS_ORIGIN: '*'
          PORT: ${ports.private.aeonstore}
          HEALTH_PORT: ${ports.health.aeonstore}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${ports.health.aeonstore}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      publisher:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/publisher/app.js'
        environment:
          HEALTH_CORS_ORIGIN: '*'
          PORT: ${ports.private.publisher}
          HEALTH_PORT: ${ports.health.publisher}
          PUBLISH_CORS_ORIGIN: '*'
          SUBSCRIBE_CORS_ORIGIN: '*'
          PUB_SUB_TYPE: '${pubSubType}'
          PUB_SUB_OPTIONS: '${pubSubOptions}'
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${ports.health.publisher}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      graphql:
        build: '../..
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/graphql/app.js'
        environment:
          APPLICATION_DIRECTORY: '/app'
          GRAPHQL_PLAYGROUND: false
          CORS_ORIGIN: '*'
          DOMAIN_EVENT_STORE_OPTIONS: '${domainEventStoreOptions}'
          DOMAIN_EVENT_STORE_TYPE: '${domainEventStoreType}'
          IDENTITY_PROVIDERS: '${identityProviders}'
          PORT: ${ports.private.graphql}
          HEALTH_PORT: ${ports.health.graphql}
          SUBSCRIBE_MESSAGES_PROTOCOL: 'http'
          SUBSCRIBE_MESSAGES_HOST_NAME: 'publisher'
          SUBSCRIBE_MESSAGES_PORT: '${ports.private.publisher}'
          SNAPSHOT_STRATEGY: '${snapshotStrategy}'
        image: '${appName}'
        init: true
        ports:
          - '${ports.public.graphql}:${ports.private.graphql}'
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${ports.health.graphql}"]
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
  getMicroservicePostgresManifest
};
