import { Configuration } from './Configuration';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import { withCamelCaseKeys } from '../../../../common/utils/withCamelCaseKeys';

const corsSchema = getCorsSchema();
const portSchema = getPortSchema();

const getConfiguration = function (): Configuration {
  const environmentVariables = getEnvironmentVariables({
    DOMAIN_EVENT_STORE_TYPE: {
      default: 'InMemory',
      schema: { type: 'string', minLength: 1 }
    },
    DOMAIN_EVENT_STORE_OPTIONS: {
      default: {},
      schema: { type: 'object' }
    },
    QUERY_DOMAIN_EVENTS_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    WRITE_DOMAIN_EVENTS_CORS_ORIGIN: {
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
    }
  });

  return withCamelCaseKeys(environmentVariables) as Configuration;
};

export {
  getConfiguration
};
