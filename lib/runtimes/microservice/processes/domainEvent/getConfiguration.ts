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
      schema: {
        type: 'string',
        minLength: 1
      }
    },
    DOMAINEVENT_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    DOMAINEVENTSTORE_OPTIONS: {
      default: {},
      schema: { type: 'object' }
    },
    DOMAINEVENTSTORE_TYPE: {
      default: 'InMemory',
      schema: { type: 'string' }
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
    PORT_PUBLIC: {
      default: 3000,
      schema: { type: 'integer' }
    },
    PORT_PRIVATE: {
      default: 4000,
      schema: { type: 'integer' }
    }
  });

  return mapKeys(environmentVariables, camelCase) as Configuration;
};

export {
  getConfiguration
};
