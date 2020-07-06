import { versions } from '../../../../versions';

const getSingleProcessInMemoryManifest = function ({ appName }: {
  appName: string;
}): string {
  const ports = {
    public: 3000,
    private: 3000,
    health: 3001
  };

  const lockStoreType = 'InMemory';
  const lockStoreOptions = JSON.stringify({});

  const domainEventStoreType = 'InMemory';
  const domainEventStoreOptions = JSON.stringify({});

  const priorityQueueStoreForCommandsType = 'InMemory';
  const priorityQueueStoreForCommandsOptions = JSON.stringify({});

  const priorityQueueStoreForDomainEventsType = 'InMemory';
  const priorityQueueStoreForDomainEventsOptions = JSON.stringify({});

  const flowProgressStoreType = 'InMemory';
  const flowProgressStoreOptions = JSON.stringify({});

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
          NODE_ENV: 'production'
          LOG_LEVEL: 'debug'
          APPLICATION_DIRECTORY: '/app'
          HTTP_API: 'true'
          GRAPHQL_API: '{"enableIntegratedClient":false}'
          CORS_ORIGIN: '*'
          DOMAIN_EVENT_STORE_OPTIONS: '${domainEventStoreOptions}'
          DOMAIN_EVENT_STORE_TYPE: '${domainEventStoreType}'
          LOCK_STORE_OPTIONS: '${lockStoreOptions}'
          LOCK_STORE_TYPE: '${lockStoreType}'
          PRIORITY_QUEUE_STORE_FOR_COMMANDS_TYPE: '${priorityQueueStoreForCommandsType}'
          PRIORITY_QUEUE_STORE_FOR_COMMANDS_OPTIONS: '${priorityQueueStoreForCommandsOptions}'
          PRIORITY_QUEUE_STORE_FOR_DOMAIN_EVENTS_TYPE: '${priorityQueueStoreForDomainEventsType}'
          PRIORITY_QUEUE_STORE_FOR_DOMAIN_EVENTS_OPTIONS: '${priorityQueueStoreForDomainEventsOptions}'
          CONSUMER_PROGRESS_STORE_TYPE: '${flowProgressStoreType}' 
          CONSUMER_PROGRESS_STORE_OPTIONS: '${flowProgressStoreOptions}'
          IDENTITY_PROVIDERS: '${identityProviders}'
          PORT: ${ports.private}
          HEALTH_PORT: ${ports.health}
          SNAPSHOT_STRATEGY: '${snapshotStrategy}'
          CONCURRENT_COMMANDS: ${100}
          CONCURRENT_FLOWS: ${1}
          COMMAND_QUEUE_RENEW_INTERVAL: ${5_000}
          ENABLE_OPEN_API_DOCUMENTATION: 'true'
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
  `;
};

export { getSingleProcessInMemoryManifest };
