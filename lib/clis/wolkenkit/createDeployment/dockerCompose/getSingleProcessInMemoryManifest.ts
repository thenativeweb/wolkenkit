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
import { PriorityQueueStoreOptions } from '../../../../stores/priorityQueueStore/PriorityQueueStoreOptions';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
import { toEnvironmentVariables } from '../../../../runtimes/shared/toEnvironmentVariables';
import { versions } from '../../../../versions';

const getSingleProcessInMemoryManifest = function ({ appName }: {
  appName: string;
}): string {
  const services = {
    main: {
      hostName: 'main',
      publicPort: 3000,
      privatePort: 3000,
      healthPort: 3001
    }
  };

  const domainEventStoreOptions: DomainEventStoreOptions = { type: 'InMemory' },
        fileStoreOptions: FileStoreOptions = { type: 'InMemory' },
        flowProgressStoreOptions: ConsumerProgressStoreOptions = { type: 'InMemory' },
        identityProviders: { issuer: string; certificate: string }[] = [],
        lockStoreOptions: LockStoreOptions = { type: 'InMemory' },
        priorityQueueStoreForCommandsOptions: DistributiveOmit<PriorityQueueStoreOptions<CommandWithMetadata<CommandData>, ItemIdentifierWithClient>, 'doesIdentifierMatchItem'> = {
          type: 'InMemory', expirationTime: 30_000
        },
        priorityQueueStoreForDomainEventsOptions: DistributiveOmit<PriorityQueueStoreOptions<DomainEvent<DomainEventData>, ItemIdentifierWithClient>, 'doesIdentifierMatchItem'> = {
          type: 'InMemory', expirationTime: 30_000
        },
        snapshotStrategy: SnapshotStrategyConfiguration = {
          name: 'lowest',
          configuration: {
            revisionLimit: 100,
            durationLimit: 500
          }
        };

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
    healthPort: services.main.healthPort,
    httpApi: true,
    identityProviders,
    lockStoreOptions,
    port: services.main.privatePort,
    priorityQueueStoreForCommandsOptions,
    priorityQueueStoreForDomainEventsOptions,
    pubSubChannelForNotifications: 'notifications',
    publisherOptions: { type: 'InMemory' },
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
  `;
};

export { getSingleProcessInMemoryManifest };
