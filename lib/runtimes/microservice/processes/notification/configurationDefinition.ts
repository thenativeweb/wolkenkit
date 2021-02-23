import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getIdentityProviderSchema } from '../../../shared/schemas/getIdentityProviderSchema';
import { getPortOrSocketSchema } from '../../../shared/schemas/getPortOrSocketSchema';
import { getSubscriberOptionsSchema } from '../../../shared/schemas/getSubscriberOptionsSchema';
import path from 'path';

const corsSchema = getCorsSchema(),
      identityProviderSchema = getIdentityProviderSchema(),
      portOrSocketSchema = getPortOrSocketSchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  applicationDirectory: {
    environmentVariable: 'APPLICATION_DIRECTORY',
    defaultValue: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
    schema: { type: 'string', minLength: 1 }
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
  notificationCorsOrigin: {
    environmentVariable: 'SUBSCRIBE_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  portOrSocket: {
    environmentVariable: 'PORT_OR_SOCKET',
    defaultValue: 3_000,
    schema: portOrSocketSchema
  },
  pubSubOptions: {
    environmentVariable: 'PUB_SUB_OPTIONS',
    defaultValue: {
      channelForNotifications: 'notifications',
      subscriber: { type: 'InMemory' }
    },
    schema: {
      type: 'object',
      properties: {
        channelForNotifications: { type: 'string', minLength: 1 },
        subscriber: getSubscriberOptionsSchema()
      },
      required: [ 'channelForNotifications', 'subscriber' ],
      additionalProperties: false
    }
  }
};

export { configurationDefinition };
