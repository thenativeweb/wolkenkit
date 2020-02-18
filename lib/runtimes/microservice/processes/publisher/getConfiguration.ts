import { Configuration } from './Configuration';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import { withCamelCaseKeys } from '../../../../common/utils/withCamelCaseKeys';

const corsSchema = getCorsSchema();
const portSchema = getPortSchema();

const getConfiguration = function (): Configuration {
  const environmentVariables = getEnvironmentVariables({
    HEALTH_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    PORT: {
      default: 3000,
      schema: portSchema
    },
    HEALTH_PORT: {
      default: 3001,
      schema: portSchema
    },
    PUBLISH_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    SUBSCRIBE_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    PUB_SUB_TYPE: {
      default: 'InMemory',
      schema: { type: 'string', minLength: 1 }
    },
    PUB_SUB_OPTIONS: {
      default: { channel: 'messages', subscriber: {}, publisher: {}},
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
    }
  });

  return withCamelCaseKeys(environmentVariables) as Configuration;
};

export { getConfiguration };
