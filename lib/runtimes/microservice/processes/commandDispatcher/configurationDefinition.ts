import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import { getPriorityQueueStoreOptionsSchema } from '../../../shared/schemas/getPriorityQueueStoreOptionsSchema';
import path from 'path';

const corsSchema = getCorsSchema();
const portSchema = getPortSchema();
const priorityQueueStoreOptionsSchema = getPriorityQueueStoreOptionsSchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  applicationDirectory: {
    environmentVariable: 'APPLICATION_DIRECTORY',
    defaultValue: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
    schema: { type: 'string', minLength: 1 }
  },
  awaitCommandCorsOrigin: {
    environmentVariable: 'AWAIT_COMMAND_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  handleCommandCorsOrigin: {
    environmentVariable: 'HANDLE_COMMAND_CORS_ORIGIN',
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
  missedCommandRecoveryInterval: {
    environmentVariable: 'MISSED_COMMAND_RECOVERY_INTERVAL',
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
    defaultValue: { type: 'InMemory', expirationTime: 30_000 },
    schema: priorityQueueStoreOptionsSchema
  },
  pubSubOptions: {
    environmentVariable: 'PUB_SUB_OPTIONS',
    defaultValue: { channel: 'newCommand', subscriber: {}, publisher: {}},
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
