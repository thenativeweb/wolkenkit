import { Configuration } from '../../../../runtimes/singleProcess/processes/main/Configuration';
import { configurationDefinition } from '../../../../runtimes/singleProcess/processes/main/configurationDefinition';
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

  const domainEventStoreOptions = {},
        domainEventStoreType = 'InMemory',
        fileStoreOptions = {},
        fileStoreType = 'InMemory',
        flowProgressStoreOptions = {},
        flowProgressStoreType = 'InMemory',
        identityProviders: { issuer: string; certificate: string }[] = [],
        lockStoreOptions = {},
        lockStoreType = 'InMemory',
        priorityQueueStoreForCommandsOptions = { expirationTime: 30_000 },
        priorityQueueStoreForCommandsType = 'InMemory',
        priorityQueueStoreForDomainEventsOptions = { expirationTime: 30_000 },
        priorityQueueStoreForDomainEventsType = 'InMemory',
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
    fileStoreOptions,
    fileStoreType,
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
  `;
};

export { getSingleProcessInMemoryManifest };
