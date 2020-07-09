import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import { getProtocolSchema } from '../../../shared/schemas/getProtocolSchema';
import { getSnapshotStrategySchema } from '../../../shared/schemas/getSnapshotStrategySchema';
import path from 'path';

const corsSchema = getCorsSchema(),
      portSchema = getPortSchema(),
      protocolSchema = getProtocolSchema(),
      snapshotStrategySchema = getSnapshotStrategySchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  aeonstoreHostName: {
    environmentVariable: 'AEONSTORE_HOST_NAME',
    defaultValue: 'aeonstore',
    schema: { type: 'string', format: 'hostname' }
  },
  aeonstorePort: {
    environmentVariable: 'AEONSTORE_PORT',
    defaultValue: 3000,
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
    defaultValue: 3000,
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
    defaultValue: 3000,
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
    defaultValue: 3001,
    schema: portSchema
  },
  lockStoreOptions: {
    environmentVariable: 'LOCK_STORE_OPTIONS',
    defaultValue: {},
    schema: { type: 'object' }
  },
  lockStoreType: {
    environmentVariable: 'LOCK_STORE_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string' }
  },
  publisherChannelNewDomainEvent: {
    environmentVariable: 'PUBLISHER_CHANNEL_NEW_DOMAIN_EVENT',
    defaultValue: 'newDomainEvent',
    schema: { type: 'string', minLength: 1 }
  },
  publisherHostName: {
    environmentVariable: 'PUBLISHER_HOST_NAME',
    defaultValue: 'publisher',
    schema: { type: 'string', format: 'hostname' }
  },
  publisherPort: {
    environmentVariable: 'PUBLISHER_PORT',
    defaultValue: 3000,
    schema: portSchema
  },
  publisherProtocol: {
    environmentVariable: 'PUBLISHER_PROTOCOL',
    defaultValue: 'http',
    schema: protocolSchema
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
