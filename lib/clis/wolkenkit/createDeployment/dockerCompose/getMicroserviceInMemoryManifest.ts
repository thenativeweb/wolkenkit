import { versions } from '../../../../versions';

const getMicroserviceInMemoryManifest = function ({ appName }: {
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
      commandDispatcher: 3000,
      domainEvents: 3000,
      aeonstore: 3000,
      publisher: 3000,
      graphql: 3000,
      domainEventDispatcher: 3000
    },
    health: {
      command: 3001,
      commandDispatcher: 3001,
      domain: 3001,
      domainEvents: 3001,
      aeonstore: 3001,
      publisher: 3001,
      graphql: 3001,
      domainEventDispatcher: 3001,
      flow: 3001
    }
  };

  const lockStoreType = 'InMemory';
  const lockStoreOptions = JSON.stringify({});

  const domainEventStoreType = 'InMemory';
  const domainEventStoreOptions = JSON.stringify({});

  const priorityQueueStoreType = 'InMemory';
  const priorityQueueStoreOptions = JSON.stringify({
    expirationTime: 30000
  });

  const consumerProgressStoreType = 'InMemory';
  const consumerProgressStoreOptions = JSON.stringify({});

  const pubSubTypePublisher = 'InMemory';
  const pubSubOptionsPublisher = JSON.stringify({
    subscriber: {},
    publisher: {}
  });

  const pubSubTypeCommandDispatcher = 'InMemory';
  const pubSubOptionsCommandDispatcher = JSON.stringify({
    channel: 'newCommand',
    subscriber: {},
    publisher: {}
  });

  const pubSubTypeDomainEventDispatcher = 'InMemory';
  const pubSubOptionsDomainEventDispatcher = JSON.stringify({
    channel: 'newDomainEvent',
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
          NODE_ENV: 'production'
          APPLICATION_DIRECTORY: '/app'
          COMMAND_CORS_ORIGIN: '*'
          COMMAND_DISPATCHER_PROTOCOL: 'http'
          COMMAND_DISPATCHER_HOST_NAME: 'command-dispatcher'
          COMMAND_DISPATCHER_PORT: ${ports.private.commandDispatcher}
          COMMAND_DISPATCHER_RETRIES: ${5}
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

      command-dispatcher:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/commandDispatcher/app.js'
        environment:
          NODE_ENV: 'production'
          APPLICATION_DIRECTORY: '/app'
          PRIORITY_QUEUE_STORE_TYPE: '${priorityQueueStoreType}'
          PRIORITY_QUEUE_STORE_OPTIONS: '${priorityQueueStoreOptions}'
          PUB_SUB_TYPE: '${pubSubTypeCommandDispatcher}'
          PUB_SUB_OPTIONS: '${pubSubOptionsCommandDispatcher}'
          AWAIT_COMMAND_CORS_ORIGIN: '*'
          HANDLE_COMMAND_CORS_ORIGIN: '*'
          HEALTH_CORS_ORIGIN: '*'
          PORT: ${ports.private.commandDispatcher}
          HEALTH_PORT: ${ports.health.commandDispatcher}
          MISSED_COMMAND_RECOVERY_INTERVAL: ${5000}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${ports.health.commandDispatcher}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      domain:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/domain/app.js'
        environment:
          NODE_ENV: 'production'
          APPLICATION_DIRECTORY: '/app'
          COMMAND_DISPATCHER_PROTOCOL: 'http'
          COMMAND_DISPATCHER_HOST_NAME: 'command-dispatcher'
          COMMAND_DISPATCHER_PORT: ${ports.private.commandDispatcher}
          COMMAND_DISPATCHER_RENEW_INTERVAL: ${5000}
          COMMAND_DISPATCHER_ACKNOWLEDGE_RETRIES: ${5}
          DOMAIN_EVENT_DISPATCHER_PROTOCOL: 'http'
          DOMAIN_EVENT_DISPATCHER_HOST_NAME: 'domain-event-dispatcher'
          DOMAIN_EVENT_DISPATCHER_PORT: ${ports.private.domainEventDispatcher}
          PUBLISHER_PROTOCOL: 'http'
          PUBLISHER_HOST_NAME: 'publisher'
          PUBLISHER_PORT: ${ports.private.publisher}
          PUBLISHER_CHANNEL_NEW_DOMAIN_EVENT: 'newDomainEvent'
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

      domain-event:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/domainEvent/app.js'
        environment:
          NODE_ENV: 'production'
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
          NODE_ENV: 'production'
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
          NODE_ENV: 'production'
          HEALTH_CORS_ORIGIN: '*'
          PORT: ${ports.private.publisher}
          HEALTH_PORT: ${ports.health.publisher}
          PUBLISH_CORS_ORIGIN: '*'
          SUBSCRIBE_CORS_ORIGIN: '*'
          PUB_SUB_TYPE: '${pubSubTypePublisher}'
          PUB_SUB_OPTIONS: '${pubSubOptionsPublisher}'
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
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/graphql/app.js'
        environment:
          NODE_ENV: 'production'
          APPLICATION_DIRECTORY: '/app'
          ENABLE_INTEGRATED_CLIENT: 'false'
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

      domain-event-dispatcher:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/domainEventDispatcher/app.js'
        environment:
          NODE_ENV: 'production'
          APPLICATION_DIRECTORY: '/app'
          PRIORITY_QUEUE_STORE_TYPE: '${priorityQueueStoreType}'
          PRIORITY_QUEUE_STORE_OPTIONS: '${priorityQueueStoreOptions}'
          PUB_SUB_TYPE: '${pubSubTypeDomainEventDispatcher}'
          PUB_SUB_OPTIONS: '${pubSubOptionsDomainEventDispatcher}'
          AWAIT_DOMAIN_EVENT_CORS_ORIGIN: '*'
          HANDLE_DOMAIN_EVENT_CORS_ORIGIN: '*'
          HEALTH_CORS_ORIGIN: '*'
          PORT: '${ports.private.domainEventDispatcher}'
          HEALTH_PORT: '${ports.health.domainEventDispatcher}'
          MISSED_DOMAIN_EVENT_RECOVERY_INTERVAL: ${5000}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${ports.health.domainEventDispatcher}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      flow:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/flow/app.js'
        environment:
          NODE_ENV: 'production'
          APPLICATION_DIRECTORY: '/app'
          DOMAIN_EVENT_DISPATCHER_PROTOCOL: 'http'
          DOMAIN_EVENT_DISPATCHER_HOST_NAME: 'domain-event-dispatcher'
          DOMAIN_EVENT_DISPATCHER_PORT: '${ports.private.domainEventDispatcher}'
          DOMAIN_EVENT_DISPATCHER_RENEW_INTERVAL: ${5000}
          DOMAIN_EVENT_DISPATCHER_ACKNOWLEDGE_RETRIES: ${5}
          COMMAND_DISPATCHER_PROTOCOL: 'http'
          COMMAND_DISPATCHER_HOST_NAME: 'command-dispatcher'
          COMMAND_DISPATCHER_PORT: ${ports.private.commandDispatcher}
          AEONSTORE_PROTOCOL: 'http'
          AEONSTORE_HOST_NAME: 'aeonstore'
          AEONSTORE_PORT: ${ports.private.aeonstore}
          LOCK_STORE_OPTIONS: '${lockStoreOptions}'
          LOCK_STORE_TYPE: '${lockStoreType}'
          CONSUMER_PROGRESS_STORE_TYPE: '${consumerProgressStoreType}'
          CONSUMER_PROGRESS_STORE_OPTIONS: '${consumerProgressStoreOptions}'
          HEALTH_CORS_ORIGIN: '*'
          HEALTH_PORT: '${ports.health.domainEventDispatcher}'
          CONCURRENT_FLOWS: ${1}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${ports.health.flow}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
  `;
};

export { getMicroserviceInMemoryManifest };
