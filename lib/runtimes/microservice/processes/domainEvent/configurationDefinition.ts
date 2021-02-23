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
  domainEventCorsOrigin: {
    environmentVariable: 'DOMAIN_EVENT_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
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
  healthPortOrSocket: {
    environmentVariable: 'HEALTH_PORT_OR_SOCKET',
    defaultValue: 3_000,
    schema: portOrSocketSchema
  },
  heartbeatInterval: {
    environmentVariable: 'HEARTBEAT_INTERVAL',
    defaultValue: 90_000,
    schema: { type: 'integer' }
  },
  identityProviders: {
    environmentVariable: 'IDENTITY_PROVIDERS',
    defaultValue: [{
      issuer: 'https://token.invalid',
      certificate: path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io')
    }],
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
      subscriber: {
        type: 'Http',
        protocol: 'http',
        hostName: 'publisher',
        portOrSocket: 3_000,
        path: '/publish/v2'
      },
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
        subscriber: subscriberOptionsSchema,
        publisher: publisherOptionsSchema
      },
      required: [ 'channelForNewDomainEvents', 'channelForNotifications', 'subscriber', 'publisher' ],
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
