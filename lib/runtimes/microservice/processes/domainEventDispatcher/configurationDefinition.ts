import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared//ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import path from 'path';

const corsSchema = getCorsSchema();
const portSchema = getPortSchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  applicationDirectory: {
    environmentVariable: 'APPLICATION_DIRECTORY',
    defaultValue: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
    schema: { type: 'string', minLength: 1 }
  },
  awaitDomainEventCorsOrigin: {
    environmentVariable: 'AWAIT_DOMAIN_EVENT_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  handleDomainEventCorsOrigin: {
    environmentVariable: 'HANDLE_DOMAIN_EVENT_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
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
  missedDomainEventRecoveryInterval: {
    environmentVariable: 'MISSED_DOMAIN_EVENT_RECOVERY_INTERVAL',
    defaultValue: 5_000,
    schema: { type: 'number', minimum: 1 }
  },
  port: {
    environmentVariable: 'PORT',
    defaultValue: 3_000,
    schema: portSchema
  },
  priorityQueueStoreOptions: {
    environmentVariable: 'PRIORITY_QUEUE_STORE_OPTIONS',
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
  priorityQueueStoreType: {
    environmentVariable: 'PRIORITY_QUEUE_STORE_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string', minLength: 1 }
  },
  pubSubOptions: {
    environmentVariable: 'PUB_SUB_OPTIONS',
    defaultValue: { channel: 'newDomainEvent', subscriber: {}, publisher: {}},
    schema: {
      type: 'object',
      properties: {
        channel: { type: 'string', minLength: 1 },
        subscriber: { type: 'object' },
        publisher: { type: 'object' }
      },
      required: [ 'channel', 'subscriber', 'publisher' ],
      additionalProperties: false
    }
  },
  pubSubType: {
    environmentVariable: 'PUB_SUB_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string', minLength: 1 }
  }
};

export { configurationDefinition };
