import { Configuration } from './Configuration';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
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
    DISPATCHER_HOST_NAME: {
      default: 'dispatcher',
      schema: {
        type: 'string',
        format: 'hostname'
      }
    },
    DISPATCHER_PORT: {
      default: 3000,
      schema: portSchema
    },
    AEONSTORE_HOST_NAME: {
      default: 'aeonstore',
      schema: {
        type: 'string',
        format: 'hostname'
      }
    },
    AEONSTORE_PORT: {
      default: 3000,
      schema: portSchema
    },
    HEALTH_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    PORT: {
      default: 3000,
      schema: portSchema
    },
    CONCURRENT_COMMANDS: {
      default: 1,
      schema: {
        type: 'number',
        minimum: 1
      }
    }
  });

  return withCamelCaseKeys(environmentVariables) as Configuration;
};

export {
  getConfiguration
};
