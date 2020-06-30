import { Configuration } from './Configuration';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import { getProtocolSchema } from '../../../shared/schemas/getProtocolSchema';
import path from 'path';
import { withCamelCaseKeys } from '../../../../common/utils/withCamelCaseKeys';

const corsSchema = getCorsSchema();
const portSchema = getPortSchema();
const protocolSchema = getProtocolSchema();

const getConfiguration = function (): Configuration {
  const environmentVariables = getEnvironmentVariables({
    APPLICATION_DIRECTORY: {
      default: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
      schema: { type: 'string', minLength: 1 }
    },
    PRIORITY_QUEUE_STORE_TYPE: {
      default: 'InMemory',
      schema: { type: 'string', minLength: 1 }
    },
    PRIORITY_QUEUE_STORE_OPTIONS: {
      default: { expirationTime: 30_000 },
      schema: {
        type: 'object',
        properties: {
          expirationTime: { type: 'number', minimum: 1 }
        },
        required: [ 'expirationTime' ],
        additionalProperties: true
      }
    },
    PUB_SUB_TYPE: {
      default: 'InMemory',
      schema: { type: 'string', minLength: 1 }
    },
    PUB_SUB_OPTIONS: {
      default: { channel: 'newDomainEvent', subscriber: {}, publisher: {}},
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
    SUBSCRIBE_MESSAGES_PROTOCOL: {
      default: 'http',
      schema: protocolSchema
    },
    SUBSCRIBE_MESSAGES_HOST_NAME: {
      default: 'publisher',
      schema: {
        type: 'string',
        format: 'hostname'
      }
    },
    SUBSCRIBE_MESSAGES_PORT: {
      default: 3000,
      schema: portSchema
    },
    SUBSCRIBE_MESSAGES_CHANNEL: {
      default: 'newDomainEventInternal',
      schema: { type: 'string' }
    },
    AWAIT_COMMAND_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    HANDLE_COMMAND_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    HEALTH_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    PORT: {
      default: 3_000,
      schema: portSchema
    },
    HEALTH_PORT: {
      default: 3_001,
      schema: portSchema
    },
    MISSED_COMMAND_RECOVERY_INTERVAL: {
      default: 5_000,
      schema: { type: 'number', minimum: 1 }
    }
  });

  return withCamelCaseKeys(environmentVariables) as Configuration;
};

export {
  getConfiguration
};
