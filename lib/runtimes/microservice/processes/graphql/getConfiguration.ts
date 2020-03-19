import { Configuration } from './Configuration';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
import { getIdentityProviderSchema } from '../../../shared/schemas/getIdentityProviderSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import { getProtocolSchema } from '../../../shared/schemas/getProtocolSchema';
import { getSnapshotStrategySchema } from '../../../shared/schemas/getSnapshotStrategySchema';
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
    ENABLE_INTEGRATED_CLIENT: {
      default: false,
      schema: { type: 'boolean' }
    },
    CORS_ORIGIN: {
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
    IDENTITY_PROVIDERS: {
      default: [],
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
    SNAPSHOT_STRATEGY: {
      default: { name: 'revision', configuration: { revisionLimit: 100 }},
      schema: getSnapshotStrategySchema()
    }
  });

  return withCamelCaseKeys(environmentVariables) as Configuration;
};

export {
  getConfiguration
};
