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
import { DomainEventStoreOptions } from '../../../../stores/domainEventStore/DomainEventStoreOptions';
import { Configuration as FileConfiguration } from '../../../../runtimes/microservice/processes/file/Configuration';
import { configurationDefinition as fileConfigurationDefinition } from '../../../../runtimes/microservice/processes/file/configurationDefinition';
import { FileStoreOptions } from '../../../../stores/fileStore/FileStoreOptions';
import { Configuration as FlowConfiguration } from '../../../../runtimes/microservice/processes/flow/Configuration';
import { configurationDefinition as flowConfigurationDefinition } from '../../../../runtimes/microservice/processes/flow/configurationDefinition';
import { Configuration as GraphqlConfiguration } from '../../../../runtimes/microservice/processes/graphql/Configuration';
import { configurationDefinition as graphqlConfigurationDefinition } from '../../../../runtimes/microservice/processes/graphql/configurationDefinition';
import { LockStoreOptions } from '../../../../stores/lockStore/LockStoreOptions';
import { minio } from './constants/minio';
import { Configuration as NotificationConfiguration } from '../../../../runtimes/microservice/processes/notification/Configuration';
import { configurationDefinition as notificationConfigurationDefinition } from '../../../../runtimes/microservice/processes/notification/configurationDefinition';
import { postgres } from './constants/postgres';
import { Configuration as PublisherConfiguration } from '../../../../runtimes/microservice/processes/publisher/Configuration';
import { configurationDefinition as publisherConfigurationDefinition } from '../../../../runtimes/microservice/processes/publisher/configurationDefinition';
import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { Configuration as ReplayConfiguration } from '../../../../runtimes/microservice/processes/replay/Configuration';
import { configurationDefinition as replayConfigurationDefinition } from '../../../../runtimes/microservice/processes/replay/configurationDefinition';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';
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
    postgres,
    minio,
    traefik: {
      hostName: 'traefik',
      publicPort: 3_000
    }
  };

  const applicationDirectory = '/app',
        corsOrigin = '*',
        domainEventStoreOptions: DomainEventStoreOptions = {
          type: 'Postgres',
          hostName: services.postgres.hostName,
          port: services.postgres.privatePort,
          userName: services.postgres.userName,
          password: services.postgres.password,
          database: services.postgres.database,
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
        identityProviders: { issuer: string; certificate: string }[] = [],
        lockStoreOptions: LockStoreOptions = {
          type: 'Postgres',
          hostName: services.postgres.hostName,
          port: services.postgres.privatePort,
          userName: services.postgres.userName,
          password: services.postgres.password,
          database: services.postgres.database,
          tableNames: {
            locks: 'locks'
          }
        },
        publisherOptions: PublisherOptions = {
          type: 'Http',
          protocol: 'http',
          hostName: services.publisher.hostName,
          port: services.publisher.privatePort,
          path: '/publish/v2'
        },
        pubSubChannelForNewCommands = 'newCommand',
        pubSubChannelForNewDomainEvents = 'newDomainEvent',
        pubSubChannelForNewInternalDomainEvents = 'newInternalDomainEvent',
        pubSubChannelForNotifications = 'notification',
        snapshotStrategy: SnapshotStrategyConfiguration = {
          name: 'lowest',
          configuration: {
            revisionLimit: 100,
            durationLimit: 500
          }
        },
        subscriberOptions: SubscriberOptions = {
          type: 'Http',
          protocol: 'http',
          hostName: services.publisher.hostName,
          port: services.publisher.privatePort,
          path: '/subscribe/v2'
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
      type: 'Postgres',
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
    pubSubOptions: {
      channelForNewCommands: pubSubChannelForNewCommands,
      subscriber: { type: 'InMemory' },
      publisher: { type: 'InMemory' }
    }
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
    pubSubOptions: {
      channelForNotifications: pubSubChannelForNotifications,
      channelForNewDomainEvents: pubSubChannelForNewDomainEvents,
      publisher: publisherOptions
    },
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
    pubSubOptions: {
      channelForNewDomainEvents: pubSubChannelForNewDomainEvents,
      channelForNotifications: pubSubChannelForNotifications,
      publisher: publisherOptions,
      subscriber: subscriberOptions
    },
    snapshotStrategy
  };

  const aeonstoreConfiguration: AeonstoreConfiguration = {
    domainEventStoreOptions,
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
      subscriber: { type: 'InMemory' },
      publisher: { type: 'InMemory' }
    },
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
    pubSubOptions: {
      channelForNewDomainEvents: pubSubChannelForNewDomainEvents,
      channelForNotifications: pubSubChannelForNotifications,
      publisher: publisherOptions,
      subscriber: subscriberOptions
    },
    snapshotStrategy
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
      type: 'Postgres',
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
    pubSubOptions: {
      channelForNewInternalDomainEvents: pubSubChannelForNewInternalDomainEvents,
      subscriber: { type: 'InMemory' },
      publisher: { type: 'InMemory' }
    }
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
      type: 'Postgres',
      hostName: services.postgres.hostName,
      port: services.postgres.privatePort,
      userName: services.postgres.userName,
      password: services.postgres.password,
      database: services.postgres.database,
      tableNames: {
        progress: 'progress-flow'
      }
    },
    domainEventDispatcherAcknowledgeRetries: 5,
    domainEventDispatcherHostName: services.domainEventDispatcher.hostName,
    domainEventDispatcherPort: services.domainEventDispatcher.privatePort,
    domainEventDispatcherProtocol: 'http',
    domainEventDispatcherRenewInterval: 5_000,
    healthCorsOrigin: corsOrigin,
    healthPort: services.flow.healthPort,
    lockStoreOptions,
    pubSubOptions: {
      channelForNotifications: pubSubChannelForNotifications,
      publisher: publisherOptions
    },
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
    viewCorsOrigin: corsOrigin,
    pubSubOptions: {
      channelForNotifications: pubSubChannelForNotifications,
      publisher: publisherOptions,
      subscriber: subscriberOptions
    }
  };

  const notificationConfiguration: NotificationConfiguration = {
    applicationDirectory,
    healthCorsOrigin: corsOrigin,
    healthPort: services.notification.healthPort,
    identityProviders,
    notificationCorsOrigin: corsOrigin,
    port: services.notification.privatePort,
    pubSubOptions: {
      channelForNotifications: pubSubChannelForNotifications,
      subscriber: subscriberOptions
    }
  };

  const fileConfiguration: FileConfiguration = {
    applicationDirectory,
    enableOpenApiDocumentation: true,
    fileCorsOrigin: corsOrigin,
    fileStoreOptions,
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
        restart: 'always'
        healthcheck:
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.command.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
        labels:
          - 'traefik.enable=true'
          - 'traefik.http.routers.${services.command.hostName}.rule=PathPrefix(\`/command\`)'
          - 'traefik.http.routers.${services.command.hostName}.entrypoints=web'
          - 'traefik.http.services.${services.command.hostName}-service.loadbalancer.server.port=${services.command.privatePort}'
          - 'traefik.http.services.${services.command.hostName}-service.loadbalancer.healthcheck.path=/health/v2/'
          - 'traefik.http.services.${services.command.hostName}-service.loadbalancer.healthcheck.port=${services.command.healthPort}'

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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.commandDispatcher.healthPort}"]
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.domain.healthPort}"]
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
        restart: 'always'
        healthcheck:
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.domainEvent.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
        labels:
          - 'traefik.enable=true'
          - 'traefik.http.routers.${services.domainEvent.hostName}.rule=PathPrefix(\`/domain-events\`)'
          - 'traefik.http.routers.${services.domainEvent.hostName}.entrypoints=web'
          - 'traefik.http.services.${services.domainEvent.hostName}-service.loadbalancer.server.port=${services.domainEvent.privatePort}'
          - 'traefik.http.services.${services.domainEvent.hostName}-service.loadbalancer.healthcheck.path=/health/v2/'
          - 'traefik.http.services.${services.domainEvent.hostName}-service.loadbalancer.healthcheck.port=${services.domainEvent.healthPort}'

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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.aeonstore.healthPort}"]
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.publisher.healthPort}"]
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
        restart: 'always'
        healthcheck:
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.graphql.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
        labels:
          - 'traefik.enable=true'
          - 'traefik.http.routers.${services.graphql.hostName}.rule=PathPrefix(\`/graphql\`)'
          - 'traefik.http.routers.${services.graphql.hostName}.entrypoints=web'
          - 'traefik.http.services.${services.graphql.hostName}-service.loadbalancer.server.port=${services.graphql.privatePort}'
          - 'traefik.http.services.${services.graphql.hostName}-service.loadbalancer.healthcheck.path=/health/v2/'
          - 'traefik.http.services.${services.graphql.hostName}-service.loadbalancer.healthcheck.port=${services.graphql.healthPort}'

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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.domainEventDispatcher.healthPort}"]
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.flow.healthPort}"]
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.replay.healthPort}"]
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
        restart: 'always'
        healthcheck:
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.view.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
        labels:
          - 'traefik.enable=true'
          - 'traefik.http.routers.${services.view.hostName}.rule=PathPrefix(\`/views\`)'
          - 'traefik.http.routers.${services.view.hostName}.entrypoints=web'
          - 'traefik.http.services.${services.view.hostName}-service.loadbalancer.server.port=${services.view.privatePort}'
          - 'traefik.http.services.${services.view.hostName}-service.loadbalancer.healthcheck.path=/health/v2/'
          - 'traefik.http.services.${services.view.hostName}-service.loadbalancer.healthcheck.port=${services.view.healthPort}'

      ${services.notification.hostName}:
        build: '../..'
        command: 'node ./node_modules/wolkenkit/build/lib/runtimes/microservice/processes/notification/app.js'
        environment:
          NODE_ENV: 'production'
${
  Object.entries(
    toEnvironmentVariables({
      configuration: notificationConfiguration,
      configurationDefinition: notificationConfigurationDefinition
    })
  ).map(([ key, value ]): string => `          ${key}: '${value}'`).join('\n')
}
        image: '${appName}'
        init: true
        restart: 'always'
        healthcheck:
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.notification.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
        labels:
          - 'traefik.enable=true'
          - 'traefik.http.routers.${services.notification.hostName}.rule=PathPrefix(\`/notifications\`)'
          - 'traefik.http.routers.${services.notification.hostName}.entrypoints=web'
          - 'traefik.http.services.${services.notification.hostName}-service.loadbalancer.server.port=${services.notification.privatePort}'
          - 'traefik.http.services.${services.notification.hostName}-service.loadbalancer.healthcheck.path=/health/v2/'
          - 'traefik.http.services.${services.notification.hostName}-service.loadbalancer.healthcheck.port=${services.notification.healthPort}'

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
        restart: 'always'
        healthcheck:
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.file.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
        labels:
          - 'traefik.enable=true'
          - 'traefik.http.routers.${services.file.hostName}.rule=PathPrefix(\`/files\`)'
          - 'traefik.http.routers.${services.file.hostName}.entrypoints=web'
          - 'traefik.http.services.${services.file.hostName}-service.loadbalancer.server.port=${services.file.privatePort}'
          - 'traefik.http.services.${services.file.hostName}-service.loadbalancer.healthcheck.path=/health/v2/'
          - 'traefik.http.services.${services.file.hostName}-service.loadbalancer.healthcheck.port=${services.file.healthPort}'

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
          
      ${services.traefik.hostName}:
        image: 'traefik:${versions.dockerImages.traefik}'
        command:
          - '--log.level=DEBUG'
          - '--api.insecure=true'
          - '--providers.docker=true'
          - '--providers.docker.exposedbydefault=false'
          - '--entrypoints.web.address=:3000'
          - '--ping'
        ports:
          - '3000:3000'
          - '8080:8080'
        volumes:
          - '/var/run/docker.sock:/var/run/docker.sock:ro'
        healthcheck:
          test: ["CMD", "traefik", "healthcheck", "--ping"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
  `;
};

export { getMicroservicePostgresManifest };
