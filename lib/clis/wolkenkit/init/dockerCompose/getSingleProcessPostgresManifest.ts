import { CommandData } from '../../../../common/elements/CommandData';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { Configuration } from '../../../../runtimes/singleProcess/processes/main/Configuration';
import { configurationDefinition } from '../../../../runtimes/singleProcess/processes/main/configurationDefinition';
import { ConsumerProgressStoreOptions } from '../../../../stores/consumerProgressStore/ConsumerProgressStoreOptions';
import { DistributiveOmit } from '../../../../common/types/DistributiveOmit';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventStoreOptions } from '../../../../stores/domainEventStore/DomainEventStoreOptions';
import { FileStoreOptions } from '../../../../stores/fileStore/FileStoreOptions';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { LockStoreOptions } from '../../../../stores/lockStore/LockStoreOptions';
import { minio } from './constants/minio';
import { postgres } from './constants/postgres';
import { PriorityQueueStoreOptions } from '../../../../stores/priorityQueueStore/PriorityQueueStoreOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
import { toEnvironmentVariables } from '../../../../runtimes/shared/toEnvironmentVariables';
import { versions } from '../../../../versions';

const getSingleProcessPostgresManifest = function ({ appName }: {
  appName: string;
}): string {
  const services = {
    main: {
      hostName: 'main',
      publicPort: 3_000,
      privatePort: 3_000,
      healthPort: 3_001
    },
    minio,
    postgres
  };

  const postgresOptions = {
    hostName: services.postgres.hostName,
    port: services.postgres.privatePort,
    userName: services.postgres.userName,
    password: services.postgres.password,
    database: services.postgres.database
  };

  const domainEventStoreOptions: DomainEventStoreOptions = {
          type: 'Postgres',
          ...postgresOptions,
          tableNames: {
            domainEvents: 'domainEvents',
            snapshots: 'snapshots'
          }
        },
        fileStoreOptions: FileStoreOptions = {
          type: 'S3',
          hostName: services.minio.hostName,
          port: services.minio.privatePort,
          encryptConnection: services.minio.encryptConnection,
          accessKey: services.minio.accessKey,
          secretKey: services.minio.secretKey,
          bucketName: services.minio.bucketName
        },
        flowProgressStoreOptions: ConsumerProgressStoreOptions = {
          type: 'Postgres',
          ...postgresOptions,
          tableNames: {
            progress: 'progress-flow'
          }
        },
        identityProviders: { issuer: string; certificate: string }[] = [],
        lockStoreOptions: LockStoreOptions = {
          type: 'Postgres',
          ...postgresOptions,
          tableNames: {
            locks: 'locks'
          }
        },
        priorityQueueStoreForCommandsOptions: DistributiveOmit<PriorityQueueStoreOptions<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>, 'doesIdentifierMatchItem'> = {
          type: 'Postgres',
          ...postgresOptions,
          tableNames: {
            items: 'items-command',
            priorityQueue: 'priorityQueue-command'
          },
          expirationTime: 30_000
        },
        priorityQueueStoreForDomainEventsOptions: DistributiveOmit<PriorityQueueStoreOptions<DomainEvent<DomainEventData>, ItemIdentifierWithClient>, 'doesIdentifierMatchItem'> = {
          type: 'Postgres',
          ...postgresOptions,
          tableNames: {
            items: 'items-domain-event',
            priorityQueue: 'priorityQueue-domain-event'
          },
          expirationTime: 30_000
        },
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
    corsOrigin: '*',
    domainEventStoreOptions,
    enableOpenApiDocumentation: true,
    fileStoreOptions,
    graphqlApi: { enableIntegratedClient: true },
    healthPortOrSocket: services.main.healthPort,
    httpApi: true,
    identityProviders,
    lockStoreOptions,
    portOrSocket: services.main.privatePort,
    priorityQueueStoreForCommandsOptions,
    priorityQueueStoreForDomainEventsOptions,
    pubSubOptions: {
      channelForNotifications: 'notification',
      publisher: { type: 'InMemory' },
      subscriber: { type: 'InMemory' }
    },
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.main.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

    volumes:
      files:
  `;
};

export { getSingleProcessPostgresManifest };
