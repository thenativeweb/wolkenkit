import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getIdentityProviderSchema } from '../../../shared/schemas/getIdentityProviderSchema';
import { getPortOrSocketSchema } from '../../../shared/schemas/getPortOrSocketSchema';
import { getProtocolSchema } from '../../../shared/schemas/getProtocolSchema';
import { getPublisherOptionsSchema } from '../../../shared/schemas/getPublisherOptionsSchema';
import { getSnapshotStrategySchema } from '../../../shared/schemas/getSnapshotStrategySchema';
import { getSubscriberOptionsSchema } from '../../../shared/schemas/getSubscriberOptionsSchema';
import path from 'path';

const corsSchema = getCorsSchema(),
      identityProviderSchema = getIdentityProviderSchema(),
      portOrSocketSchema = getPortOrSocketSchema(),
      protocolSchema = getProtocolSchema(),
      publisherOptionsSchema = getPublisherOptionsSchema(),
      snapshotStrategySchema = getSnapshotStrategySchema(),
      subscriberOptionsSchema = getSubscriberOptionsSchema();

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
  enableIntegratedClient: {
    environmentVariable: 'ENABLE_INTEGRATED_CLIENT',
    defaultValue: false,
    schema: { type: 'boolean' }
  },
  healthPortOrSocket: {
    environmentVariable: 'HEALTH_PORT_OR_SOCKET',
    defaultValue: 3_001,
    schema: portOrSocketSchema
  },
  identityProviders: {
    environmentVariable: 'IDENTITY_PROVIDERS',
    defaultValue: [],
    schema: identityProviderSchema
  },
  portOrSocket: {
    environmentVariable: 'PORT_OR_SOCKET',
    defaultValue: 3_000,
    schema: portOrSocketSchema
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
      },
      subscriber: {
        type: 'Http',
        protocol: 'http',
        hostName: 'publisher',
        portOrSocket: 3_000,
        path: '/subscribe/v2'
      }
    },
    schema: {
      type: 'object',
      properties: {
        channelForNewDomainEvents: { type: 'string', minLength: 1 },
        channelForNotifications: { type: 'string', minLength: 1 },
        publisher: publisherOptionsSchema,
        subscriber: subscriberOptionsSchema
      },
      required: [ 'channelForNewDomainEvents', 'channelForNotifications', 'publisher', 'subscriber' ],
      additionalProperties: false
    }
  },
  snapshotStrategy: {
    environmentVariable: 'SNAPSHOT_STRATEGY',
    defaultValue: { name: 'revision', configuration: { revisionLimit: 100 }},
    schema: snapshotStrategySchema
  }
};

export { configurationDefinition };
