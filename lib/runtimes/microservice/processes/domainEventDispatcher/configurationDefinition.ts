import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getPortOrSocketSchema } from '../../../shared/schemas/getPortOrSocketSchema';
import { getPriorityQueueStoreOptionsSchema } from '../../../shared/schemas/getPriorityQueueStoreOptionsSchema';
import { getPublisherOptionsSchema } from '../../../shared/schemas/getPublisherOptionsSchema';
import { getSubscriberOptionsSchema } from '../../../shared/schemas/getSubscriberOptionsSchema';
import path from 'path';

const corsSchema = getCorsSchema(),
      portOrSocketSchema = getPortOrSocketSchema(),
      priorityQueueStoreOptionsSchema = getPriorityQueueStoreOptionsSchema(),
      publisherOptionsSchema = getPublisherOptionsSchema(),
      subscriberOptionsSchema = getSubscriberOptionsSchema();

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
  healthPortOrSocket: {
    environmentVariable: 'HEALTH_PORT_OR_SOCKET',
    defaultValue: 3_001,
    schema: portOrSocketSchema
  },
  missedDomainEventRecoveryInterval: {
    environmentVariable: 'MISSED_DOMAIN_EVENT_RECOVERY_INTERVAL',
    defaultValue: 5_000,
    schema: { type: 'number', minimum: 1 }
  },
  portOrSocket: {
    environmentVariable: 'PORT_OR_SOCKET',
    defaultValue: 3_000,
    schema: portOrSocketSchema
  },
  priorityQueueStoreOptions: {
    environmentVariable: 'PRIORITY_QUEUE_STORE_OPTIONS',
    defaultValue: { type: 'InMemory', expirationTime: 30_000 },
    schema: priorityQueueStoreOptionsSchema
  },
  pubSubOptions: {
    environmentVariable: 'PUB_SUB_OPTIONS',
    defaultValue: {
      channelForNewInternalDomainEvents: 'newInternalDomainEvent',
      subscriber: { type: 'InMemory' },
      publisher: { type: 'InMemory' }
    },
    schema: {
      type: 'object',
      properties: {
        channelForNewInternalDomainEvents: { type: 'string', minLength: 1 },
        subscriber: subscriberOptionsSchema,
        publisher: publisherOptionsSchema
      },
      required: [ 'channelForNewInternalDomainEvents', 'subscriber', 'publisher' ],
      additionalProperties: false
    }
  }
};

export { configurationDefinition };
