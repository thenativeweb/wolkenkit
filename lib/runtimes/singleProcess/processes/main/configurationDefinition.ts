import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getIdentityProviderSchema } from '../../../shared/schemas/getIdentityProviderSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import { getSnapshotStrategySchema } from '../../../shared/schemas/getSnapshotStrategySchema';
import path from 'path';

const corsSchema = getCorsSchema(),
      identityProviderSchema = getIdentityProviderSchema(),
      portSchema = getPortSchema(),
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
    defaultValue: {},
    schema: {
      type: 'object'
    }
  },
  consumerProgressStoreType: {
    environmentVariable: 'CONSUMER_PROGRESS_STORE_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string', minLength: 1 }
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
  enableOpenApiDocumentation: {
    environmentVariable: 'ENABLE_OPEN_API_DOCUMENTATION',
    defaultValue: false,
    schema: { type: 'boolean' }
  },
  fileStoreOptions: {
    environmentVariable: 'FILE_STORE_OPTIONS',
    defaultValue: {},
    schema: { type: 'object' }
  },
  fileStoreType: {
    environmentVariable: 'FILE_STORE_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string' }
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
    defaultValue: {},
    schema: { type: 'object' }
  },
  lockStoreType: {
    environmentVariable: 'LOCK_STORE_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string' }
  },
  port: {
    environmentVariable: 'PORT',
    defaultValue: 3000,
    schema: portSchema
  },
  priorityQueueStoreForCommandsOptions: {
    environmentVariable: 'PRIORITY_QUEUE_STORE_FOR_COMMANDS_OPTIONS',
    defaultValue: { expirationTime: 30_000 },
    schema: {
      type: 'object',
      properties: {
        expirationTime: { type: 'number', minimum: 1 }
      },
      required: [ 'expirationTime' ],
      additionalProperties: true
    }
  },
  priorityQueueStoreForCommandsType: {
    environmentVariable: 'PRIORITY_QUEUE_STORE_FOR_COMMANDS_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string', minLength: 1 }
  },
  priorityQueueStoreForDomainEventsOptions: {
    environmentVariable: 'PRIORITY_QUEUE_STORE_FOR_DOMAIN_EVENTS_OPTIONS',
    defaultValue: { expirationTime: 30_000 },
    schema: {
      type: 'object',
      properties: {
        expirationTime: { type: 'number', minimum: 1 }
      },
      required: [ 'expirationTime' ],
      additionalProperties: true
    }
  },
  priorityQueueStoreForDomainEventsType: {
    environmentVariable: 'PRIORITY_QUEUE_STORE_FOR_DOMAIN_EVENTS_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string', minLength: 1 }
  },
  snapshotStrategy: {
    environmentVariable: 'SNAPSHOT_STRATEGY',
    defaultValue: { name: 'revision', configuration: { revisionLimit: 100 }},
    schema: snapshotStrategySchema
  }
};

export { configurationDefinition };
