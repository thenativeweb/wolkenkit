import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getLockStoreOptionsSchema } from '../../../shared/schemas/getLockStoreOptionsSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import { getProtocolSchema } from '../../../shared/schemas/getProtocolSchema';
import { getPublisherOptionsSchema } from '../../../shared/schemas/getPublisherOptionsSchema';
import { getSnapshotStrategySchema } from '../../../shared/schemas/getSnapshotStrategySchema';
import path from 'path';

const corsSchema = getCorsSchema(),
      lockStoreOptionsSchema = getLockStoreOptionsSchema(),
      portSchema = getPortSchema(),
      protocolSchema = getProtocolSchema(),
      publisherOptionsSchema = getPublisherOptionsSchema(),
      snapshotStrategySchema = getSnapshotStrategySchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  aeonstoreHostName: {
    environmentVariable: 'AEONSTORE_HOST_NAME',
    defaultValue: 'aeonstore',
    schema: { type: 'string', format: 'hostname' }
  },
  aeonstorePort: {
    environmentVariable: 'AEONSTORE_PORT',
    defaultValue: 3_000,
    schema: portSchema
  },
  aeonstoreProtocol: {
    environmentVariable: 'AEONSTORE_PROTOCOL',
    defaultValue: 'http',
    schema: protocolSchema
  },
  applicationDirectory: {
    environmentVariable: 'APPLICATION_DIRECTORY',
    defaultValue: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
    schema: { type: 'string', minLength: 1 }
  },
  commandDispatcherAcknowledgeRetries: {
    environmentVariable: 'COMMAND_DISPATCHER_ACKNOWLEDGE_RETRIES',
    defaultValue: 5,
    schema: { type: 'integer' }
  },
  commandDispatcherHostName: {
    environmentVariable: 'COMMAND_DISPATCHER_HOST_NAME',
    defaultValue: 'command-dispatcher',
    schema: { type: 'string', format: 'hostname' }
  },
  commandDispatcherPort: {
    environmentVariable: 'COMMAND_DISPATCHER_PORT',
    defaultValue: 3_000,
    schema: portSchema
  },
  commandDispatcherProtocol: {
    environmentVariable: 'COMMAND_DISPATCHER_PROTOCOL',
    defaultValue: 'http',
    schema: protocolSchema
  },
  commandDispatcherRenewInterval: {
    environmentVariable: 'COMMAND_DISPATCHER_RENEW_INTERVAL',
    defaultValue: 5_000,
    schema: { type: 'integer' }
  },
  concurrentCommands: {
    environmentVariable: 'CONCURRENT_COMMANDS',
    defaultValue: 1,
    schema: { type: 'number', minimum: 1 }
  },
  domainEventDispatcherHostName: {
    environmentVariable: 'DOMAIN_EVENT_DISPATCHER_HOST_NAME',
    defaultValue: 'domain-event-dispatcher',
    schema: {
      type: 'string',
      format: 'hostname'
    }
  },
  domainEventDispatcherPort: {
    environmentVariable: 'DOMAIN_EVENT_DISPATCHER_PORT',
    defaultValue: 3_000,
    schema: portSchema
  },
  domainEventDispatcherProtocol: {
    environmentVariable: 'DOMAIN_EVENT_DISPATCHER_PROTOCOL',
    defaultValue: 'http',
    schema: protocolSchema
  },
  healthCorsOrigin: {
    environmentVariable: 'HEALTH_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  healthPort: {
    environmentVariable: 'HEALTH_PORT',
    defaultValue: 3_001,
    schema: portSchema
  },
  lockStoreOptions: {
    environmentVariable: 'LOCK_STORE_OPTIONS',
    defaultValue: { type: 'InMemory' },
    schema: lockStoreOptionsSchema
  },
  pubSubOptions: {
    environmentVariable: 'PUB_SUB_OPTIONS',
    defaultValue: {
      channelForNewDomainEvents: 'newDomainEvent',
      channelForNotifications: 'notification',
      publisher: {
        type: 'Http',
        protocol: 'http',
        hostName: 'publisher',
        port: 3_000,
        path: '/publish/v2'
      }
    },
    schema: {
      type: 'object',
      properties: {
        channelForNewDomainEvents: { type: 'string', minLength: 1 },
        channelForNotifications: { type: 'string', minLength: 1 },
        publisher: publisherOptionsSchema
      },
      required: [ 'channelForNewDomainEvents', 'channelForNotifications', 'publisher' ],
      additionalProperties: false
    }
  },
  snapshotStrategy: {
    environmentVariable: 'SNAPSHOT_STRATEGY',
    defaultValue: {
      name: 'lowest',
      configuration: {
        revisionLimit: 100,
        durationLimit: 500
      }
    },
    schema: snapshotStrategySchema
  }
};

export { configurationDefinition };
