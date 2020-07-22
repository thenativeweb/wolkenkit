import { Configuration as AeonstoreConfiguration } from '../../../../runtimes/microservice/processes/domainEventStore/Configuration';
import { configurationDefinition as aeonstoreConfigurationDefinition } from '../../../../runtimes/microservice/processes/domainEventStore/configurationDefinition';
import { Configuration as CommandConfiguration } from '../../../../runtimes/microservice/processes/command/Configuration';
import { configurationDefinition as commandConfigurationDefinition } from '../../../../runtimes/microservice/processes/command/configurationDefinition';
import { Configuration as CommandDispatcherConfiguration } from '../../../../runtimes/microservice/processes/commandDispatcher/Configuration';
import { configurationDefinition as commandDispatcherConfigurationDefinition } from '../../../../runtimes/microservice/processes/commandDispatcher/configurationDefinition';
import { Configuration as DomainConfiguration } from '../../../../runtimes/microservice/processes/domain/Configuration';
import { configurationDefinition as domainConfigurationDefinition } from '../../../../runtimes/microservice/processes/domain/configurationDefinition';
import { Configuration as DomainEventConfiguration } from '../../../../runtimes/microservice/processes/domainEvent/Configuration';
import { configurationDefinition as domainEventConfigurationDefinition } from '../../../../runtimes/microservice/processes/domainEvent/configurationDefinition';
import { Configuration as DomainEventDispatcherConfiguration } from '../../../../runtimes/microservice/processes/domainEventDispatcher/Configuration';
import { configurationDefinition as domainEventDispatcherConfigurationDefinition } from '../../../../runtimes/microservice/processes/domainEventDispatcher/configurationDefinition';
import { Configuration as FileConfiguration } from '../../../../runtimes/microservice/processes/file/Configuration';
import { configurationDefinition as fileConfigurationDefinition } from '../../../../runtimes/microservice/processes/file/configurationDefinition';
import { Configuration as FlowConfiguration } from '../../../../runtimes/microservice/processes/flow/Configuration';
import { configurationDefinition as flowConfigurationDefinition } from '../../../../runtimes/microservice/processes/flow/configurationDefinition';
import { Configuration as GraphqlConfiguration } from '../../../../runtimes/microservice/processes/graphql/Configuration';
import { configurationDefinition as graphqlConfigurationDefinition } from '../../../../runtimes/microservice/processes/graphql/configurationDefinition';
import { Configuration as PublisherConfiguration } from '../../../../runtimes/microservice/processes/publisher/Configuration';
import { configurationDefinition as publisherConfigurationDefinition } from '../../../../runtimes/microservice/processes/publisher/configurationDefinition';
import { Configuration as ReplayConfiguration } from '../../../../runtimes/microservice/processes/replay/Configuration';
import { configurationDefinition as replayConfigurationDefinition } from '../../../../runtimes/microservice/processes/replay/configurationDefinition';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
import { toEnvironmentVariables } from '../../../../runtimes/shared/toEnvironmentVariables';
import { versions } from '../../../../versions';
import { Configuration as ViewConfiguration } from '../../../../runtimes/microservice/processes/view/Configuration';
import { configurationDefinition as viewConfigurationDefinition } from '../../../../runtimes/microservice/processes/view/configurationDefinition';

const getMicroservicePostgresManifest = function ({ appName }: {
  appName: string;
}): string {
  const services = {
    command: {
      hostName: 'command',
      publicPort: 3000,
      privatePort: 3000,
      healthPort: 3001
    },
    commandDispatcher: {
      hostName: 'command-dispatcher',
      privatePort: 3000,
      healthPort: 3001
    },
    domain: {
      hostName: 'domain',
      privatePort: 3000,
      healthPort: 3001
    },
    domainEvent: {
      hostName: 'domain-event',
      publicPort: 3001,
      privatePort: 3000,
      healthPort: 3001
    },
    aeonstore: {
      hostName: 'aeonstore',
      privatePort: 3000,
      healthPort: 3001
    },
    publisher: {
      hostName: 'publisher',
      privatePort: 3000,
      healthPort: 3001
    },
    graphql: {
      hostName: 'graphql',
      publicPort: 3003,
      privatePort: 3000,
      healthPort: 3001
    },
    domainEventDispatcher: {
      hostName: 'domain-event-dispatcher',
      privatePort: 3000,
      healthPort: 3001
    },
    flow: {
      hostName: 'flow',
      privatePort: 3000,
      healthPort: 3001
    },
    replay: {
      hostName: 'replay',
      privatePort: 3000,
      healthPort: 3001
    },
    view: {
      hostName: 'view',
      publicPort: 3002,
      privatePort: 3000,
      healthPort: 3001
    },
    file: {
      hostName: 'file',
      publicPort: 3004,
      privatePort: 3000,
      healthPort: 3001
    },
    postgres: {
      hostName: 'postgres',
      privatePort: 5432,
      userName: 'wolkenkit',
      password: 'please-replace-this',
      database: 'wolkenkit'
    },
    minio: {
      hostName: 'minio',
      privatePort: 9000,
      accessKey: 'wolkenkit',
      secretKey: 'please-replace-this',
      encryptConnection: false
    }
  };

  const applicationDirectory = '/app',
        corsOrigin = '*',
        domainEventStoreOptions = {
          hostName: services.postgres.hostName,
          port: services.postgres.privatePort,
          userName: services.postgres.userName,
          password: services.postgres.password,
          database: services.postgres.database,
          tableNames: {
            domainEvent: 'domainevents',
            snapshots: 'snapshots'
          }
        },
        domainEventStoreType = 'Postgres',
        fileStoreOptions = {
          hostName: services.minio.hostName,
          port: services.minio.privatePort,
          encryptConnection: services.minio.encryptConnection,
          accessKey: services.minio.accessKey,
          secretKey: services.minio.secretKey,
          bucketName: 'files'
        },
        fileStoreType = 'S3',
        identityProviders: { issuer: string; certificate: string }[] = [],
        lockStoreOptions = {
          hostName: services.postgres.hostName,
          port: services.postgres.privatePort,
          userName: services.postgres.userName,
          password: services.postgres.password,
          database: services.postgres.database,
          tableNames: {
            locks: 'locks'
          }
        },
        lockStoreType = 'Postgres',
        publisherChannelNewDomainEvent = 'newDomainEvent',
        snapshotStrategy: SnapshotStrategyConfiguration = {
          name: 'lowest',
          configuration: {
            revisionLimit: 100,
            durationLimit: 500
          }
        };

  const commandConfiguration: CommandConfiguration = {
    applicationDirectory,
    commandCorsOrigin: corsOrigin,
    commandDispatcherHostName: services.commandDispatcher.hostName,
    commandDispatcherPort: services.commandDispatcher.privatePort,
    commandDispatcherProtocol: 'http',
    commandDispatcherRetries: 5,
    enableOpenApiDocumentation: true,
    healthCorsOrigin: corsOrigin,
    healthPort: services.command.healthPort,
    identityProviders,
    port: services.command.privatePort
  };

  const commandDispatcherConfiguration: CommandDispatcherConfiguration = {
    applicationDirectory,
    awaitCommandCorsOrigin: corsOrigin,
    handleCommandCorsOrigin: corsOrigin,
    healthCorsOrigin: corsOrigin,
    healthPort: services.commandDispatcher.healthPort,
    missedCommandRecoveryInterval: 5_000,
    port: services.commandDispatcher.privatePort,
    priorityQueueStoreOptions: {
      hostName: services.postgres.hostName,
      port: services.postgres.privatePort,
      userName: services.postgres.userName,
      password: services.postgres.password,
      database: services.postgres.database,
      tableNames: {
        items: 'items-command',
        priorityQueue: 'priorityQueue-command'
      },
      expirationTime: 30_000
    },
    priorityQueueStoreType: 'Postgres',
    pubSubOptions: {
      channel: 'newCommand',
      subscriber: {},
      publisher: {}
    },
    pubSubType: 'InMemory'
  };

  const domainConfiguration: DomainConfiguration = {
    aeonstoreHostName: services.aeonstore.hostName,
    aeonstorePort: services.aeonstore.privatePort,
    aeonstoreProtocol: 'http',
    applicationDirectory,
    commandDispatcherAcknowledgeRetries: 5,
    commandDispatcherHostName: services.commandDispatcher.hostName,
    commandDispatcherPort: services.commandDispatcher.privatePort,
    commandDispatcherProtocol: 'http',
    commandDispatcherRenewInterval: 5_000,
    concurrentCommands: 1,
    domainEventDispatcherHostName: services.domainEventDispatcher.hostName,
    domainEventDispatcherPort: services.domainEventDispatcher.privatePort,
    domainEventDispatcherProtocol: 'http',
    healthCorsOrigin: corsOrigin,
    healthPort: services.domain.healthPort,
    lockStoreOptions,
    lockStoreType,
    publisherChannelNewDomainEvent,
    publisherHostName: services.publisher.hostName,
    publisherPort: services.publisher.privatePort,
    publisherProtocol: 'http',
    snapshotStrategy
  };

  const domainEventConfiguration: DomainEventConfiguration = {
    aeonstoreHostName: services.aeonstore.hostName,
    aeonstorePort: services.aeonstore.privatePort,
    aeonstoreProtocol: 'http',
    applicationDirectory,
    domainEventCorsOrigin: corsOrigin,
    enableOpenApiDocumentation: true,
    healthCorsOrigin: corsOrigin,
    healthPort: services.domainEvent.healthPort,
    identityProviders,
    port: services.domainEvent.privatePort,
    snapshotStrategy,
    subscribeMessagesChannel: publisherChannelNewDomainEvent,
    subscribeMessagesHostName: services.publisher.hostName,
    subscribeMessagesPort: services.publisher.privatePort,
    subscribeMessagesProtocol: 'http'
  };

  const aeonstoreConfiguration: AeonstoreConfiguration = {
    domainEventStoreOptions,
    domainEventStoreType,
    healthCorsOrigin: corsOrigin,
    healthPort: services.aeonstore.healthPort,
    port: services.aeonstore.privatePort,
    queryDomainEventsCorsOrigin: corsOrigin,
    writeDomainEventsCorsOrigin: corsOrigin
  };

  const publisherConfiguration: PublisherConfiguration = {
    healthCorsOrigin: corsOrigin,
    healthPort: services.publisher.healthPort,
    port: services.publisher.privatePort,
    publishCorsOrigin: corsOrigin,
    pubSubOptions: {
      subscriber: {},
      publisher: {}
    },
    pubSubType: 'InMemory',
    subscribeCorsOrigin: corsOrigin
  };

  const graphqlConfiguration: GraphqlConfiguration = {
    aeonstoreHostName: services.aeonstore.hostName,
    aeonstorePort: services.aeonstore.privatePort,
    aeonstoreProtocol: 'http',
    applicationDirectory,
    commandDispatcherHostName: services.commandDispatcher.hostName,
    commandDispatcherPort: services.commandDispatcher.privatePort,
    commandDispatcherProtocol: 'http',
    commandDispatcherRetries: 5,
    corsOrigin,
    enableIntegratedClient: true,
    healthPort: services.graphql.healthPort,
    identityProviders,
    port: services.graphql.privatePort,
    snapshotStrategy,
    subscribeMessagesChannel: publisherChannelNewDomainEvent,
    subscribeMessagesHostName: services.publisher.hostName,
    subscribeMessagesPort: services.publisher.privatePort,
    subscribeMessagesProtocol: 'http'
  };

  const domainEventDispatcherConfiguration: DomainEventDispatcherConfiguration = {
    applicationDirectory,
    awaitDomainEventCorsOrigin: corsOrigin,
    handleDomainEventCorsOrigin: corsOrigin,
    healthCorsOrigin: corsOrigin,
    healthPort: services.domainEventDispatcher.healthPort,
    missedDomainEventRecoveryInterval: 5_000,
    port: services.domainEventDispatcher.privatePort,
    priorityQueueStoreOptions: {
      hostName: services.postgres.hostName,
      port: services.postgres.privatePort,
      userName: services.postgres.userName,
      password: services.postgres.password,
      database: services.postgres.database,
      tableNames: {
        items: 'items-domain-event',
        priorityQueue: 'priorityQueue-domain-event'
      },
      expirationTime: 30_000
    },
    priorityQueueStoreType: 'Postgres',
    pubSubOptions: {
      channel: 'newDomainEvent',
      subscriber: {},
      publisher: {}
    },
    pubSubType: 'InMemory'
  };

  const flowConfiguration: FlowConfiguration = {
    aeonstoreHostName: services.aeonstore.hostName,
    aeonstorePort: services.aeonstore.privatePort,
    aeonstoreProtocol: 'http',
    applicationDirectory,
    commandDispatcherHostName: services.commandDispatcher.hostName,
    commandDispatcherPort: services.commandDispatcher.privatePort,
    commandDispatcherProtocol: 'http',
    concurrentFlows: 1,
    consumerProgressStoreOptions: {
      hostName: services.postgres.hostName,
      port: services.postgres.privatePort,
      userName: services.postgres.userName,
      password: services.postgres.password,
      database: services.postgres.database,
      tableNames: {
        progress: 'progress-flow'
      }
    },
    consumerProgressStoreType: 'Postgres',
    domainEventDispatcherAcknowledgeRetries: 5,
    domainEventDispatcherHostName: services.domainEventDispatcher.hostName,
    domainEventDispatcherPort: services.domainEventDispatcher.privatePort,
    domainEventDispatcherProtocol: 'http',
    domainEventDispatcherRenewInterval: 5_000,
    healthCorsOrigin: corsOrigin,
    healthPort: services.flow.healthPort,
    lockStoreOptions,
    lockStoreType,
    replayServerHostName: services.replay.hostName,
    replayServerPort: services.replay.privatePort,
    replayServerProtocol: 'http',
    snapshotStrategy
  };

  const replayConfiguration: ReplayConfiguration = {
    aeonstoreHostName: services.aeonstore.hostName,
    aeonstorePort: services.aeonstore.privatePort,
    aeonstoreProtocol: 'http',
    applicationDirectory,
    corsOrigin,
    domainEventDispatcherHostName: services.domainEventDispatcher.hostName,
    domainEventDispatcherPort: services.domainEventDispatcher.privatePort,
    domainEventDispatcherProtocol: 'http',
    healthCorsOrigin: corsOrigin,
    healthPort: services.replay.healthPort,
    port: services.replay.privatePort
  };

  const viewConfiguration: ViewConfiguration = {
    applicationDirectory,
    enableOpenApiDocumentation: true,
    healthCorsOrigin: corsOrigin,
    healthPort: services.view.healthPort,
    identityProviders,
    port: services.view.privatePort,
    viewCorsOrigin: corsOrigin
  };

  const fileConfiguration: FileConfiguration = {
    applicationDirectory,
    enableOpenApiDocumentation: true,
    fileCorsOrigin: corsOrigin,
    fileStoreOptions,
    fileStoreType,
    healthCorsOrigin: corsOrigin,
    healthPort: services.file.healthPort,
    identityProviders,
    port: services.file.privatePort
  };

  return `
    version: '${versions.infrastructure['docker-compose']}'

    services:
      ${services.command.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/command/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({ configuration: commandConfiguration, configurationDefinition: commandConfigurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        ports:
          - '${services.command.publicPort}:${services.command.privatePort}'
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.command.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.commandDispatcher.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/commandDispatcher/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({ configuration: commandDispatcherConfiguration, configurationDefinition: commandDispatcherConfigurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.commandDispatcher.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.domain.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/domain/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({ configuration: domainConfiguration, configurationDefinition: domainConfigurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.domain.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.domainEvent.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/domainEvent/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({ configuration: domainEventConfiguration, configurationDefinition: domainEventConfigurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        ports:
          - '${services.domainEvent.publicPort}:${services.domainEvent.privatePort}'
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.domainEvent.privatePort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.aeonstore.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/domainEventStore/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({ configuration: aeonstoreConfiguration, configurationDefinition: aeonstoreConfigurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.aeonstore.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.publisher.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/publisher/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({ configuration: publisherConfiguration, configurationDefinition: publisherConfigurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.publisher.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.graphql.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/graphql/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({ configuration: graphqlConfiguration, configurationDefinition: graphqlConfigurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        ports:
          - '${services.graphql.publicPort}:${services.graphql.privatePort}'
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.graphql.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.domainEventDispatcher.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/domainEventDispatcher/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({ configuration: domainEventDispatcherConfiguration, configurationDefinition: domainEventDispatcherConfigurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.domainEventDispatcher.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.flow.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/flow/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({ configuration: flowConfiguration, configurationDefinition: flowConfigurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.flow.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.replay.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/replay/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({ configuration: replayConfiguration, configurationDefinition: replayConfigurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.replay.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.view.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/view/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({ configuration: viewConfiguration, configurationDefinition: viewConfigurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        ports:
          - '${services.view.publicPort}:${services.view.privatePort}'
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.view.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.file.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/file/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({ configuration: fileConfiguration, configurationDefinition: fileConfigurationDefinition })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        ports:
          - '${services.file.publicPort}:${services.file.privatePort}'
        restart: 'always'
        healthcheck:
          test: ["CMD", "curl", "-f", "http://localhost:${services.file.healthPort}"]
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

      ${services.minio.hostName}:
        image: 'minio/minio:${versions.dockerImages.minio}'
        command: 'server /data'
        environment:
          MINIO_ACCESS_KEY: '${services.minio.accessKey}'
          MINIO_SECRET_KEY: '${services.minio.secretKey}'
        restart: 'always'
        volumes:
          - 'minio:/data'

    volumes:
      postgres:
      minio:
  `;
};

export { getMicroservicePostgresManifest };
