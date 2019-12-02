import { Configuration } from './Configuration';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
import { getIdentityProviderSchema } from '../../../shared/schemas/getIdentityProviderSchema';
import path from 'path';
import { camelCase, mapKeys } from 'lodash';

const corsSchema = getCorsSchema();

const getConfiguration = function (): Configuration {
  const environmentVariables = getEnvironmentVariables({
    APPLICATION_DIRECTORY: {
      default: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
      schema: { type: 'string' }
    },
    COMMAND_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    DISPATCHER_HOST_NAME: {
      default: 'dispatcher',
      schema: { type: 'string' }
    },
    DISPATCHER_PORT: {
      default: 3000,
      schema: { type: 'number' }
    },
    DISPATCHER_RETRIES: {
      default: 5,
      schema: { type: 'number' }
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
      schema: { type: 'number' }
    }
  });

  return mapKeys(environmentVariables, camelCase) as Configuration;
};

export {
  getConfiguration
};
