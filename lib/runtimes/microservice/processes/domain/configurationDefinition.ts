import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getLockStoreOptionsSchema } from '../../../shared/schemas/getLockStoreOptionsSchema';
import { getPortOrSocketSchema } from '../../../shared/schemas/getPortOrSocketSchema';
import { getProtocolSchema } from '../../../shared/schemas/getProtocolSchema';
import { getPublisherOptionsSchema } from '../../../shared/schemas/getPublisherOptionsSchema';
import { getSnapshotStrategySchema } from '../../../shared/schemas/getSnapshotStrategySchema';
import path from 'path';

const corsSchema = getCorsSchema(),
      lockStoreOptionsSchema = getLockStoreOptionsSchema(),
      portOrSocketSchema = getPortOrSocketSchema(),
      protocolSchema = getProtocolSchema(),
      publisherOptionsSchema = getPublisherOptionsSchema(),
      snapshotStrategySchema = getSnapshotStrategySchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  aeonstoreHostName: {
    environmentVariable: 'AEONSTORE_HOST_NAME',
    defaultValue: 'aeonstore',
    schema: { type: 'string', format: 'hostname' }
  },
  aeonstorePortOrSocket: {
    environmentVariable: 'AEONSTORE_PORT_OR_SOCKET',
    defaultValue: 3_000,
    schema: portOrSocketSchema
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
  commandDispatcherPortOrSocket: {
    environmentVariable: 'COMMAND_DISPATCHER_PORT_OR_SOCKET',
    defaultValue: 3_000,
    schema: portOrSocketSchema
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
  domainEventDispatcherPortOrSocket: {
    environmentVariable: 'DOMAIN_EVENT_DISPATCHER_PORT_OR_SOCKET',
    defaultValue: 3_000,
    schema: portOrSocketSchema
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
  healthPortOrSocket: {
    environmentVariable: 'HEALTH_PORT_OR_SOCKET',
    defaultValue: 3_001,
    schema: portOrSocketSchema
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
        portOrSocket: 3_000,
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
