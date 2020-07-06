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
      schema: {
        type: 'string',
        minLength: 1
      }
    },
    DOMAIN_EVENT_DISPATCHER_PROTOCOL: {
      default: 'http',
      schema: protocolSchema
    },
    DOMAIN_EVENT_DISPATCHER_HOST_NAME: {
      default: 'domain-event-dispatcher',
      schema: {
        type: 'string',
        format: 'hostname'
      }
    },
    DOMAIN_EVENT_DISPATCHER_PORT: {
      default: 3000,
      schema: portSchema
    },
    AEONSTORE_PROTOCOL: {
      default: 'http',
      schema: protocolSchema
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
    HEALTH_PORT: {
      default: 3001,
      schema: portSchema
    },
    CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    PORT: {
      default: 3000,
      schema: portSchema
    }
  });

  return withCamelCaseKeys(environmentVariables) as Configuration;
};

export { getConfiguration };
