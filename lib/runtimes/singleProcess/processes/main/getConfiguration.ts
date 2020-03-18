import { Configuration } from './Configuration';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
import { getIdentityProviderSchema } from '../../../shared/schemas/getIdentityProviderSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import { getSnapshotStrategySchema } from '../../../shared/schemas/getSnapshotStrategySchema';
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
    HTTP_API: {
      default: true,
      schema: { type: 'boolean' }
    },
    GRAPHQL_API: {
      default: false,
      schema: {
        oneOf: [
          { type: 'boolean', enum: [ 'false' ]},
          {
            type: 'object',
            properties: {
              enableIntegratedClient: { type: 'boolean' }
            }
          }
        ]
      }
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
    LOCK_STORE_OPTIONS: {
      default: {},
      schema: { type: 'object' }
    },
    LOCK_STORE_TYPE: {
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
    SNAPSHOT_STRATEGY: {
      default: { name: 'revision', configuration: { revisionLimit: 100 }},
      schema: getSnapshotStrategySchema()
    },
    CONCURRENT_COMMANDS: {
      default: 1,
      schema: {
        type: 'number',
        minimum: 1
      }
    },
    COMMAND_QUEUE_RENEW_INTERVAL: {
      default: 5_000
    }
  });

  return withCamelCaseKeys(environmentVariables) as Configuration;
};

export {
  getConfiguration
};
