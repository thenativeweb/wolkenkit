import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getConsumerProgressStoreOptionsSchema } from '../../../shared/schemas/getConsumerProgressStoreOptionsSchema';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getDomainEventStoreOptionsSchema } from '../../../shared/schemas/getDomainEventStoreOptionsSchema';
import { getFileStoreOptionsSchema } from '../../../shared/schemas/getFileStoreOptionsSchema';
import { getIdentityProviderSchema } from '../../../shared/schemas/getIdentityProviderSchema';
import { getLockStoreOptionsSchema } from '../../../shared/schemas/getLockStoreOptionsSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import { getPriorityQueueStoreOptionsSchema } from '../../../shared/schemas/getPriorityQueueStoreOptionsSchema';
import { getSnapshotStrategySchema } from '../../../shared/schemas/getSnapshotStrategySchema';
import path from 'path';

const consumerProgressStoreOptionsSchema = getConsumerProgressStoreOptionsSchema(),
      corsSchema = getCorsSchema(),
      domainEventStoreOptionsSchema = getDomainEventStoreOptionsSchema(),
      fileStoreOptionsSchema = getFileStoreOptionsSchema(),
      identityProviderSchema = getIdentityProviderSchema(),
      lockStoreOptionsSchema = getLockStoreOptionsSchema(),
      portSchema = getPortSchema(),
      priorityQueueStoreOptionsSchema = getPriorityQueueStoreOptionsSchema(),
      snapshotStrategySchema = getSnapshotStrategySchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  applicationDirectory: {
    environmentVariable: 'APPLICATION_DIRECTORY',
    defaultValue: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
    schema: {
      type: 'string',
      minLength: 1
    }
  },
  commandQueueRenewInterval: {
    environmentVariable: 'COMMAND_QUEUE_RENEW_INTERVAL',
    defaultValue: 5_000,
    schema: { type: 'integer' }
  },
  concurrentCommands: {
    environmentVariable: 'CONCURRENT_COMMANDS',
    defaultValue: 1,
    schema: {
      type: 'number',
      minimum: 1
    }
  },
  concurrentFlows: {
    environmentVariable: 'CONCURRENT_FLOWS',
    defaultValue: 1,
    schema: {
      type: 'number',
      minimum: 1
    }
  },
  consumerProgressStoreOptions: {
    environmentVariable: 'CONSUMER_PROGRESS_STORE_OPTIONS',
    defaultValue: { type: 'InMemory' },
    schema: consumerProgressStoreOptionsSchema
  },
  corsOrigin: {
    environmentVariable: 'CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  domainEventStoreOptions: {
    environmentVariable: 'DOMAIN_EVENT_STORE_OPTIONS',
    defaultValue: { type: 'InMemory' },
    schema: domainEventStoreOptionsSchema
  },
  enableOpenApiDocumentation: {
    environmentVariable: 'ENABLE_OPEN_API_DOCUMENTATION',
    defaultValue: false,
    schema: { type: 'boolean' }
  },
  fileStoreOptions: {
    environmentVariable: 'FILE_STORE_OPTIONS',
    defaultValue: { type: 'InMemory' },
    schema: fileStoreOptionsSchema
  },
  graphqlApi: {
    environmentVariable: 'GRAPHQL_API',
    defaultValue: false,
    schema: {
      oneOf: [
        { type: 'boolean', enum: [ false ]},
        {
          type: 'object',
          properties: {
            enableIntegratedClient: { type: 'boolean' }
          }
        }
      ]
    }
  },
  healthPort: {
    environmentVariable: 'HEALTH_PORT',
    defaultValue: 3001,
    schema: portSchema
  },
  httpApi: {
    environmentVariable: 'HTTP_API',
    defaultValue: true,
    schema: { type: 'boolean' }
  },
  identityProviders: {
    environmentVariable: 'IDENTITY_PROVIDERS',
    defaultValue: [],
    schema: identityProviderSchema
  },
  lockStoreOptions: {
    environmentVariable: 'LOCK_STORE_OPTIONS',
    defaultValue: { type: 'InMemory' },
    schema: lockStoreOptionsSchema
  },
  port: {
    environmentVariable: 'PORT',
    defaultValue: 3000,
    schema: portSchema
  },
  priorityQueueStoreForCommandsOptions: {
    environmentVariable: 'PRIORITY_QUEUE_STORE_FOR_COMMANDS_OPTIONS',
    defaultValue: { type: 'InMemory', expirationTime: 30_000 },
    schema: priorityQueueStoreOptionsSchema
  },
  priorityQueueStoreForDomainEventsOptions: {
    environmentVariable: 'PRIORITY_QUEUE_STORE_FOR_DOMAIN_EVENTS_OPTIONS',
    defaultValue: { type: 'InMemory', expirationTime: 30_000 },
    schema: priorityQueueStoreOptionsSchema
  },
  snapshotStrategy: {
    environmentVariable: 'SNAPSHOT_STRATEGY',
    defaultValue: { name: 'revision', configuration: { revisionLimit: 100 }},
    schema: snapshotStrategySchema
  }
};

export { configurationDefinition };
