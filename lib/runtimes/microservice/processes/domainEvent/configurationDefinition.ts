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
  domainEventCorsOrigin: {
    environmentVariable: 'DOMAIN_EVENT_CORS_ORIGIN',
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
  enableOpenApiDocumentation: {
    environmentVariable: 'ENABLE_OPEN_API_DOCUMENTATION',
    defaultValue: false,
    schema: { type: 'boolean' }
  },
  healthCorsOrigin: {
    environmentVariable: 'HEALTH_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  healthPort: {
    environmentVariable: 'HEALTH_PORT',
    defaultValue: 3000,
    schema: portSchema
  },
  identityProviders: {
    environmentVariable: 'IDENTITY_PROVIDERS',
    defaultValue: [{
      issuer: 'https://token.invalid',
      certificate: path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io')
    }],
    schema: identityProviderSchema
  },
  port: {
    environmentVariable: 'PORT',
    defaultValue: 3000,
    schema: portSchema
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
