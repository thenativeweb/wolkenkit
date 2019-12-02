import { Configuration } from './Configuration';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
import { getIdentityProviderSchema } from '../../../shared/schemas/getIdentityProviderSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import path from 'path';
import { withCamelCaseKeys } from '../../../../common/utils/withCamelCaseKeys';

const corsSchema = getCorsSchema();
const portSchema = getPortSchema();

const getConfiguration = function (): Configuration {
  const environmentVariables = getEnvironmentVariables({
    APPLICATION_DIRECTORY: {
      default: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
      schema: {
        type: 'string',
        minLength: 1
      }
    },
    DOMAIN_EVENT_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    DOMAIN_EVENT_STORE_OPTIONS: {
      default: {},
      schema: { type: 'object' }
    },
    DOMAIN_EVENT_STORE_TYPE: {
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
      schema: portSchema
    },
    PORT_PRIVATE: {
      default: 4000,
      schema: portSchema
    }
  });

  return withCamelCaseKeys(environmentVariables) as Configuration;
};

export {
  getConfiguration
};
