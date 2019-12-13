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
      schema: { type: 'string', minLength: 1 }
    },
    PRIORITY_QUEUE_STORE_TYPE: {
      default: 'InMemory',
      schema: { type: 'string', minLength: 1 }
    },
    PRIORITY_QUEUE_STORE_OPTIONS: {
      default: {},
      schema: { type: 'object' }
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
    QUEUE_LOCK_EXPIRATION_TIME: {
      default: 5_000,
      schema: { type: 'number', minimum: 1 }
    },
    QUEUE_POLL_INTERVAL: {
      default: 500,
      schema: { type: 'number', minimum: 1 }
    }
  });

  return withCamelCaseKeys(environmentVariables) as Configuration;
};

export {
  getConfiguration
};
