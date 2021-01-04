import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getIdentityProviderSchema } from '../../../shared/schemas/getIdentityProviderSchema';
import { getPortOrSocketSchema } from '../../../shared/schemas/getPortOrSocketSchema';
import { getPublisherOptionsSchema } from '../../../shared/schemas/getPublisherOptionsSchema';
import { getSubscriberOptionsSchema } from '../../../shared/schemas/getSubscriberOptionsSchema';
import path from 'path';

const corsSchema = getCorsSchema(),
      identityProviderSchema = getIdentityProviderSchema(),
      portOrSocketSchema = getPortOrSocketSchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  applicationDirectory: {
    environmentVariable: 'APPLICATION_DIRECTORY',
    defaultValue: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
    schema: {
      type: 'string',
      minLength: 1
    }
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
    defaultValue: 3_001,
    schema: portOrSocketSchema
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
      channelForNotifications: 'notifications',
      subscriber: { type: 'InMemory' },
      publisher: { type: 'InMemory' }
    },
    schema: {
      type: 'object',
      properties: {
        channelForNotifications: { type: 'string', minLength: 1 },
        subscriber: getSubscriberOptionsSchema(),
        publisher: getPublisherOptionsSchema()
      },
      required: [ 'channelForNotifications', 'subscriber', 'publisher' ],
      additionalProperties: false
    }
  },
  viewCorsOrigin: {
    environmentVariable: 'VIEW_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  }
};

export { configurationDefinition };
