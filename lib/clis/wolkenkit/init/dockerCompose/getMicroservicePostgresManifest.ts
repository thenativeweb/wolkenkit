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
import { Configuration as NotificationConfiguration } from '../../../../runtimes/microservice/processes/notification/Configuration';
import { configurationDefinition as notificationConfigurationDefinition } from '../../../../runtimes/microservice/processes/notification/configurationDefinition';
import { Configuration as PublisherConfiguration } from '../../../../runtimes/microservice/processes/publisher/Configuration';
import { configurationDefinition as publisherConfigurationDefinition } from '../../../../runtimes/microservice/processes/publisher/configurationDefinition';
import { PublisherOptions } from '../../../../messaging/pubSub/PublisherOptions';
import { Configuration as ReplayConfiguration } from '../../../../runtimes/microservice/processes/replay/Configuration';
import { configurationDefinition as replayConfigurationDefinition } from '../../../../runtimes/microservice/processes/replay/configurationDefinition';
import { services } from './services';
import { SnapshotStrategyConfiguration } from '../../../../common/domain/SnapshotStrategyConfiguration';
import { SubscriberOptions } from '../../../../messaging/pubSub/SubscriberOptions';
import { toEnvironmentVariables } from '../../../../runtimes/shared/toEnvironmentVariables';
import { versions } from '../../../../versions';
import { Configuration as ViewConfiguration } from '../../../../runtimes/microservice/processes/view/Configuration';
import { configurationDefinition as viewConfigurationDefinition } from '../../../../runtimes/microservice/processes/view/configurationDefinition';

const getMicroservicePostgresManifest = function ({ appName }: {
  appName: string;
}): string {
  const applicationDirectory = '/app',
        corsOrigin = '*',
        domainEventStoreOptions: DomainEventStoreOptions = {
          type: 'Postgres',
          hostName: services.stores.postgres.hostName,
          port: services.stores.postgres.privatePort,
          userName: services.stores.postgres.userName,
          password: services.stores.postgres.password,
          database: services.stores.postgres.database,
          tableNames: {
            domainEvents: 'domainEvents',
            snapshots: 'snapshots'
          }
        },
        fileStoreOptions: FileStoreOptions = {
          type: 'S3',
          hostName: services.stores.minio.hostName,
          port: services.stores.minio.privatePort,
          encryptConnection: services.stores.minio.encryptConnection,
          accessKey: services.stores.minio.accessKey,
          secretKey: services.stores.minio.secretKey,
          bucketName: services.stores.minio.bucketName
        },
        identityProviders: { issuer: string; certificate: string }[] = [],
        lockStoreOptions: LockStoreOptions = {
          type: 'Postgres',
          hostName: services.stores.postgres.hostName,
          port: services.stores.postgres.privatePort,
          userName: services.stores.postgres.userName,
          password: services.stores.postgres.password,
          database: services.stores.postgres.database,
          tableNames: {
            locks: 'locks'
          }
        },
        publisherOptions: PublisherOptions = {
          type: 'Http',
          protocol: 'http',
          hostName: services.microService.publisher.hostName,
          portOrSocket: services.microService.publisher.privatePort,
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
          hostName: services.microService.publisher.hostName,
          portOrSocket: services.microService.publisher.privatePort,
          path: '/subscribe/v2'
        };

  const commandConfiguration: CommandConfiguration = {
    applicationDirectory,
    commandCorsOrigin: corsOrigin,
    commandDispatcherHostName: services.microService.commandDispatcher.hostName,
    commandDispatcherPortOrSocket: services.microService.commandDispatcher.privatePort,
    commandDispatcherProtocol: 'http',
    commandDispatcherRetries: 5,
    enableOpenApiDocumentation: true,
    healthCorsOrigin: corsOrigin,
    healthPortOrSocket: services.microService.command.healthPort,
    identityProviders,
    portOrSocket: services.microService.command.privatePort
  };

  const commandDispatcherConfiguration: CommandDispatcherConfiguration = {
    applicationDirectory,
    awaitCommandCorsOrigin: corsOrigin,
    handleCommandCorsOrigin: corsOrigin,
    healthCorsOrigin: corsOrigin,
    healthPortOrSocket: services.microService.commandDispatcher.healthPort,
    missedCommandRecoveryInterval: 5_000,
    portOrSocket: services.microService.commandDispatcher.privatePort,
    priorityQueueStoreOptions: {
      type: 'Postgres',
      hostName: services.stores.postgres.hostName,
      port: services.stores.postgres.privatePort,
      userName: services.stores.postgres.userName,
      password: services.stores.postgres.password,
      database: services.stores.postgres.database,
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
    aeonstoreHostName: services.microService.aeonstore.hostName,
    aeonstorePortOrSocket: services.microService.aeonstore.privatePort,
    aeonstoreProtocol: 'http',
    applicationDirectory,
    commandDispatcherAcknowledgeRetries: 5,
    commandDispatcherHostName: services.microService.commandDispatcher.hostName,
    commandDispatcherPortOrSocket: services.microService.commandDispatcher.privatePort,
    commandDispatcherProtocol: 'http',
    commandDispatcherRenewInterval: 5_000,
    concurrentCommands: 1,
    domainEventDispatcherHostName: services.microService.domainEventDispatcher.hostName,
    domainEventDispatcherPortOrSocket: services.microService.domainEventDispatcher.privatePort,
    domainEventDispatcherProtocol: 'http',
    healthCorsOrigin: corsOrigin,
    healthPortOrSocket: services.microService.domain.healthPort,
    lockStoreOptions,
    pubSubOptions: {
      channelForNotifications: pubSubChannelForNotifications,
      channelForNewDomainEvents: pubSubChannelForNewDomainEvents,
      publisher: publisherOptions
    },
    snapshotStrategy
  };

  const domainEventConfiguration: DomainEventConfiguration = {
    aeonstoreHostName: services.microService.aeonstore.hostName,
    aeonstorePortOrSocket: services.microService.aeonstore.privatePort,
    aeonstoreProtocol: 'http',
    applicationDirectory,
    domainEventCorsOrigin: corsOrigin,
    enableOpenApiDocumentation: true,
    healthCorsOrigin: corsOrigin,
    healthPortOrSocket: services.microService.domainEvent.healthPort,
    identityProviders,
    portOrSocket: services.microService.domainEvent.privatePort,
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
    healthPortOrSocket: services.microService.aeonstore.healthPort,
    portOrSocket: services.microService.aeonstore.privatePort,
    queryDomainEventsCorsOrigin: corsOrigin,
    writeDomainEventsCorsOrigin: corsOrigin
  };

  const publisherConfiguration: PublisherConfiguration = {
    healthCorsOrigin: corsOrigin,
    healthPortOrSocket: services.microService.publisher.healthPort,
    portOrSocket: services.microService.publisher.privatePort,
    publishCorsOrigin: corsOrigin,
    pubSubOptions: {
      subscriber: { type: 'InMemory' },
      publisher: { type: 'InMemory' }
    },
    subscribeCorsOrigin: corsOrigin
  };

  const graphqlConfiguration: GraphqlConfiguration = {
    aeonstoreHostName: services.microService.aeonstore.hostName,
    aeonstorePortOrSocket: services.microService.aeonstore.privatePort,
    aeonstoreProtocol: 'http',
    applicationDirectory,
    commandDispatcherHostName: services.microService.commandDispatcher.hostName,
    commandDispatcherPortOrSocket: services.microService.commandDispatcher.privatePort,
    commandDispatcherProtocol: 'http',
    commandDispatcherRetries: 5,
    corsOrigin,
    enableIntegratedClient: true,
    healthPortOrSocket: services.microService.graphql.healthPort,
    identityProviders,
    portOrSocket: services.microService.graphql.privatePort,
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
    healthPortOrSocket: services.microService.domainEventDispatcher.healthPort,
    missedDomainEventRecoveryInterval: 5_000,
    portOrSocket: services.microService.domainEventDispatcher.privatePort,
    priorityQueueStoreOptions: {
      type: 'Postgres',
      hostName: services.stores.postgres.hostName,
      port: services.stores.postgres.privatePort,
      userName: services.stores.postgres.userName,
      password: services.stores.postgres.password,
      database: services.stores.postgres.database,
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
    aeonstoreHostName: services.microService.aeonstore.hostName,
    aeonstorePortOrSocket: services.microService.aeonstore.privatePort,
    aeonstoreProtocol: 'http',
    applicationDirectory,
    commandDispatcherHostName: services.microService.commandDispatcher.hostName,
    commandDispatcherPortOrSocket: services.microService.commandDispatcher.privatePort,
    commandDispatcherProtocol: 'http',
    concurrentFlows: 1,
    consumerProgressStoreOptions: {
      type: 'Postgres',
      hostName: services.stores.postgres.hostName,
      port: services.stores.postgres.privatePort,
      userName: services.stores.postgres.userName,
      password: services.stores.postgres.password,
      database: services.stores.postgres.database,
      tableNames: {
        progress: 'progress-flow'
      }
    },
    domainEventDispatcherAcknowledgeRetries: 5,
    domainEventDispatcherHostName: services.microService.domainEventDispatcher.hostName,
    domainEventDispatcherPortOrSocket: services.microService.domainEventDispatcher.privatePort,
    domainEventDispatcherProtocol: 'http',
    domainEventDispatcherRenewInterval: 5_000,
    healthCorsOrigin: corsOrigin,
    healthPortOrSocket: services.microService.flow.healthPort,
    lockStoreOptions,
    pubSubOptions: {
      channelForNotifications: pubSubChannelForNotifications,
      publisher: publisherOptions
    },
    replayServerHostName: services.microService.replay.hostName,
    replayServerPortOrSocket: services.microService.replay.privatePort,
    replayServerProtocol: 'http',
    snapshotStrategy
  };

  const replayConfiguration: ReplayConfiguration = {
    aeonstoreHostName: services.microService.aeonstore.hostName,
    aeonstorePortOrSocket: services.microService.aeonstore.privatePort,
    aeonstoreProtocol: 'http',
    applicationDirectory,
    corsOrigin,
    domainEventDispatcherHostName: services.microService.domainEventDispatcher.hostName,
    domainEventDispatcherPortOrSocket: services.microService.domainEventDispatcher.privatePort,
    domainEventDispatcherProtocol: 'http',
    healthCorsOrigin: corsOrigin,
    healthPortOrSocket: services.microService.replay.healthPort,
    portOrSocket: services.microService.replay.privatePort
  };

  const viewConfiguration: ViewConfiguration = {
    applicationDirectory,
    enableOpenApiDocumentation: true,
    healthCorsOrigin: corsOrigin,
    healthPortOrSocket: services.microService.view.healthPort,
    identityProviders,
    portOrSocket: services.microService.view.privatePort,
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
    healthPortOrSocket: services.microService.notification.healthPort,
    identityProviders,
    notificationCorsOrigin: corsOrigin,
    portOrSocket: services.microService.notification.privatePort,
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
    healthPortOrSocket: services.microService.file.healthPort,
    identityProviders,
    portOrSocket: services.microService.file.privatePort
  };

  return `
    version: '${versions.infrastructure['docker-compose']}'

    services:
      ${services.microService.command.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.command.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
        labels:
          - 'traefik.enable=true'
          - 'traefik.http.routers.${services.microService.command.hostName}.rule=PathPrefix(\`/command\`)'
          - 'traefik.http.routers.${services.microService.command.hostName}.entrypoints=web'
          - 'traefik.http.services.microService.${services.microService.command.hostName}-service.loadbalancer.server.port=${services.microService.command.privatePort}'
          - 'traefik.http.services.microService.${services.microService.command.hostName}-service.loadbalancer.healthcheck.path=/health/v2/'
          - 'traefik.http.services.microService.${services.microService.command.hostName}-service.loadbalancer.healthcheck.port=${services.microService.command.healthPort}'

      ${services.microService.commandDispatcher.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.commandDispatcher.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.microService.domain.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.domain.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.microService.domainEvent.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.domainEvent.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
        labels:
          - 'traefik.enable=true'
          - 'traefik.http.routers.${services.microService.domainEvent.hostName}.rule=PathPrefix(\`/domain-events\`)'
          - 'traefik.http.routers.${services.microService.domainEvent.hostName}.entrypoints=web'
          - 'traefik.http.services.microService.${services.microService.domainEvent.hostName}-service.loadbalancer.server.port=${services.microService.domainEvent.privatePort}'
          - 'traefik.http.services.microService.${services.microService.domainEvent.hostName}-service.loadbalancer.healthcheck.path=/health/v2/'
          - 'traefik.http.services.microService.${services.microService.domainEvent.hostName}-service.loadbalancer.healthcheck.port=${services.microService.domainEvent.healthPort}'

      ${services.microService.aeonstore.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.aeonstore.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.microService.publisher.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.publisher.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.microService.graphql.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.graphql.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
        labels:
          - 'traefik.enable=true'
          - 'traefik.http.routers.${services.microService.graphql.hostName}.rule=PathPrefix(\`/graphql\`)'
          - 'traefik.http.routers.${services.microService.graphql.hostName}.entrypoints=web'
          - 'traefik.http.services.microService.${services.microService.graphql.hostName}-service.loadbalancer.server.port=${services.microService.graphql.privatePort}'
          - 'traefik.http.services.microService.${services.microService.graphql.hostName}-service.loadbalancer.healthcheck.path=/health/v2/'
          - 'traefik.http.services.microService.${services.microService.graphql.hostName}-service.loadbalancer.healthcheck.port=${services.microService.graphql.healthPort}'

      ${services.microService.domainEventDispatcher.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.domainEventDispatcher.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.microService.flow.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.flow.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.microService.replay.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.replay.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s

      ${services.microService.view.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.view.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
        labels:
          - 'traefik.enable=true'
          - 'traefik.http.routers.${services.microService.view.hostName}.rule=PathPrefix(\`/views\`)'
          - 'traefik.http.routers.${services.microService.view.hostName}.entrypoints=web'
          - 'traefik.http.services.microService.${services.microService.view.hostName}-service.loadbalancer.server.port=${services.microService.view.privatePort}'
          - 'traefik.http.services.microService.${services.microService.view.hostName}-service.loadbalancer.healthcheck.path=/health/v2/'
          - 'traefik.http.services.microService.${services.microService.view.hostName}-service.loadbalancer.healthcheck.port=${services.microService.view.healthPort}'

      ${services.microService.notification.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.notification.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
        labels:
          - 'traefik.enable=true'
          - 'traefik.http.routers.${services.microService.notification.hostName}.rule=PathPrefix(\`/notifications\`)'
          - 'traefik.http.routers.${services.microService.notification.hostName}.entrypoints=web'
          - 'traefik.http.services.microService.${services.microService.notification.hostName}-service.loadbalancer.server.port=${services.microService.notification.privatePort}'
          - 'traefik.http.services.microService.${services.microService.notification.hostName}-service.loadbalancer.healthcheck.path=/health/v2/'
          - 'traefik.http.services.microService.${services.microService.notification.hostName}-service.loadbalancer.healthcheck.port=${services.microService.notification.healthPort}'

      ${services.microService.file.hostName}:
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
          test: ["CMD", "node", "./node_modules/wolkenkit/build/lib/bin/wolkenkit", "health", "--health-port", "${services.microService.file.healthPort}"]
          interval: 30s
          timeout: 10s
          retries: 3
          start_period: 30s
        labels:
          - 'traefik.enable=true'
          - 'traefik.http.routers.${services.microService.file.hostName}.rule=PathPrefix(\`/files\`)'
          - 'traefik.http.routers.${services.microService.file.hostName}.entrypoints=web'
          - 'traefik.http.services.microService.${services.microService.file.hostName}-service.loadbalancer.server.port=${services.microService.file.privatePort}'
          - 'traefik.http.services.microService.${services.microService.file.hostName}-service.loadbalancer.healthcheck.path=/health/v2/'
          - 'traefik.http.services.microService.${services.microService.file.hostName}-service.loadbalancer.healthcheck.port=${services.microService.file.healthPort}'

      ${services.microService.traefik.hostName}:
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
