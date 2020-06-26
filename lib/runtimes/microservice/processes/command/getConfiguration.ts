import { Configuration } from './Configuration';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
import { getIdentityProviderSchema } from '../../../shared/schemas/getIdentityProviderSchema';
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
      schema: {
        type: 'string',
        minLength: 1
      }
    },
    COMMAND_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    COMMAND_DISPATCHER_PROTOCOL: {
      default: 'http',
      schema: protocolSchema
    },
    COMMAND_DISPATCHER_HOST_NAME: {
      default: 'commandDispatcher',
      schema: {
        type: 'string',
        format: 'hostname'
      }
    },
    COMMAND_DISPATCHER_PORT: {
      default: 3000,
      schema: portSchema
    },
    COMMAND_DISPATCHER_RETRIES: {
      default: 5,
      schema: { type: 'integer' }
    },
    HEALTH_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    IDENTITY_PROVIDERS: {
      default: [{
        issuer: 'https://token.invalid',
        certificate: path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io')
      }],
      schema: getIdentityProviderSchema()
    },
    PORT: {
      default: 3000,
      schema: portSchema
    },
    HEALTH_PORT: {
      default: 3001,
      schema: portSchema
    },
    ENABLE_OPEN_API_DOCUMENTATION: {
      default: false,
      schema: { type: 'boolean' }
    }
  });

  return withCamelCaseKeys(environmentVariables) as Configuration;
};

export {
  getConfiguration
};
