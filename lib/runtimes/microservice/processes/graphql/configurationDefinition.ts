import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getIdentityProviderSchema } from '../../../shared/schemas/getIdentityProviderSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import { getProtocolSchema } from '../../../shared/schemas/getProtocolSchema';
import { getSnapshotStrategySchema } from '../../../shared/schemas/getSnapshotStrategySchema';
import path from 'path';

const corsSchema = getCorsSchema(),
      identityProviderSchema = getIdentityProviderSchema(),
      portSchema = getPortSchema(),
      protocolSchema = getProtocolSchema(),
      snapshotStrategySchema = getSnapshotStrategySchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  applicationDirectory: {
    environmentVariable: 'APPLICATION_DIRECTORY',
    defaultValue: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
    schema: { type: 'string', minLength: 1 }
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
  commandDispatcherRetries: {
    environmentVariable: 'COMMAND_DISPATCHER_RETRIES',
    defaultValue: 5,
    schema: { type: 'integer' }
  },
  corsOrigin: {
    environmentVariable: 'CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  domainEventStoreOptions: {
    environmentVariable: 'DOMAIN_EVENT_STORE_OPTIONS',
    defaultValue: {},
    schema: { type: 'object' }
  },
  domainEventStoreType: {
    environmentVariable: 'DOMAIN_EVENT_STORE_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string' }
  },
  enableIntegratedClient: {
    environmentVariable: 'ENABLE_INTEGRATED_CLIENT',
    defaultValue: false,
    schema: { type: 'boolean' }
  },
  healthPort: {
    environmentVariable: 'HEALTH_PORT',
    defaultValue: 3001,
    schema: portSchema
  },
  identityProviders: {
    environmentVariable: 'IDENTITY_PROVIDERS',
    defaultValue: [],
    schema: identityProviderSchema
  },
  port: {
    environmentVariable: 'PORT',
    defaultValue: 3000,
    schema: portSchema
  },
  snapshotStrategy: {
    environmentVariable: 'SNAPSHOT_STRATEGY',
    defaultValue: { name: 'revision', configuration: { revisionLimit: 100 }},
    schema: snapshotStrategySchema
  },
  subscribeMessagesChannel: {
    environmentVariable: 'SUBSCRIBE_MESSAGES_CHANNEL',
    defaultValue: 'newDomainEvent',
    schema: { type: 'string', minLength: 1 }
  },
  subscribeMessagesHostName: {
    environmentVariable: 'SUBSCRIBE_MESSAGES_HOST_NAME',
    defaultValue: 'publisher',
    schema: { type: 'string', format: 'hostname' }
  },
  subscribeMessagesPort: {
    environmentVariable: 'SUBSCRIBE_MESSAGES_PORT',
    defaultValue: 3000,
    schema: portSchema
  },
  subscribeMessagesProtocol: {
    environmentVariable: 'SUBSCRIBE_MESSAGES_PROTOCOL',
    defaultValue: 'http',
    schema: protocolSchema
  }
};

export { configurationDefinition };
