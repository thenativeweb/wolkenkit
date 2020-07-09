import { Configuration } from '../../../../runtimes/singleProcess/processes/main/Configuration';
import { configurationDefinition } from '../../../../runtimes/singleProcess/processes/main/configurationDefinition';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
import { toEnvironmentVariables } from '../../../../runtimes/shared/toEnvironmentVariables';
import { versions } from '../../../../versions';

const getSingleProcessPostgresManifest = function ({ appName }: {
  appName: string;
}): string {
  const services = {
    main: {
      hostName: 'main',
      publicPort: 3000,
      privatePort: 3000,
      healthPort: 3001
    },
    postgres: {
      hostName: 'postgres',
      privatePort: 5432,
      userName: 'wolkenkit',
      password: 'please-replace-this',
      database: 'wolkenkit'
    }
  };

  const postgresOptions = {
    hostName: services.postgres.hostName,
    port: services.postgres.privatePort,
    userName: services.postgres.userName,
    password: services.postgres.password,
    database: services.postgres.database
  };

  const domainEventStoreOptions = {
          ...postgresOptions,
          tableNames: {
            domainEvents: 'domainevents',
            snapshots: 'snapshots'
          }
        },
        domainEventStoreType = 'Postgres',
        flowProgressStoreOptions = {
          ...postgresOptions,
          tableNames: {
            progress: 'progress-flow'
          }
        },
        flowProgressStoreType = 'Postgres',
        identityProviders: { issuer: string; certificate: string }[] = [],
        lockStoreOptions = {
          ...postgresOptions,
          tableNames: {
            locks: 'locks'
          }
        },
        lockStoreType = 'Postgres',
        priorityQueueStoreForCommandsOptions = {
          ...postgresOptions,
          tableNames: {
            items: 'items-command',
            priorityQueue: 'priorityQueue-command'
          },
          expirationTime: 30000
        },
        priorityQueueStoreForCommandsType = 'Postgres',
        priorityQueueStoreForDomainEventsOptions = {
          ...postgresOptions,
          tableNames: {
            items: 'items-domain-event',
            priorityQueue: 'priorityQueue-domain-event'
          },
          expirationTime: 30000
        },
        priorityQueueStoreForDomainEventsType = 'Postgres',
        snapshotStrategy = {
          name: 'lowest',
          configuration: {
            revisionLimit: 100,
            durationLimit: 500
          }
        } as SnapshotStrategyConfiguration;

  const mainConfiguration: Configuration = {
    applicationDirectory: '/app',
    commandQueueRenewInterval: 5_000,
    concurrentCommands: 100,
    concurrentFlows: 1,
    consumerProgressStoreOptions: flowProgressStoreOptions,
    consumerProgressStoreType: flowProgressStoreType,
    corsOrigin: '*',
    domainEventStoreOptions,
    domainEventStoreType,
    enableOpenApiDocumentation: true,
    graphqlApi: { enableIntegratedClient: true },
    healthPort: services.main.healthPort,
    httpApi: true,
    identityProviders,
    lockStoreOptions,
    lockStoreType,
    port: services.main.privatePort,
    priorityQueueStoreForCommandsOptions,
    priorityQueueStoreForCommandsType,
    priorityQueueStoreForDomainEventsOptions,
    priorityQueueStoreForDomainEventsType,
    snapshotStrategy
  };

  return `
    version: '${versions.infrastructure['docker-compose']}'

    services:
      ${services.main.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/singleProcess/processes/main/app.js'
        environment:
          NODE_ENV: 'production'
          LOG_LEVEL: 'debug'
${
  Object.entries(
    toEnvironmentVariables({ configuration: mainConfiguration, configurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        ports:
          - '${services.main.publicPort}:${services.main.privatePort}'
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.main.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.postgres.hostName}:
        image: 'postgres:${versions.dockerImages.postgres}'
        environment:
          POSTGRES_DB: '${services.postgres.database}'
          POSTGRES_USER: '${services.postgres.userName}'
          POSTGRES_PASSWORD: '${services.postgres.password}'
          PGDATA: '/var/lib/postgresql/data'
        restart: 'always'
        volumes:
          - 'postgres:/var/lib/postgresql/data'

    volumes:
      postgres:
  `;
};

export { getSingleProcessPostgresManifest };
