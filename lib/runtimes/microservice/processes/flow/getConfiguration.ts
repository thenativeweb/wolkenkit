import { Configuration } from './Configuration';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getEnvironmentVariables } from '../../../../common/utils/process/getEnvironmentVariables';
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
    DOMAIN_EVENT_DISPATCHER_RENEW_INTERVAL: {
      default: 5_000
    },
    DOMAIN_EVENT_DISPATCHER_ACKNOWLEDGE_RETRIES: {
      default: 5,
      schema: { type: 'integer' }
    },
    COMMAND_DISPATCHER_PROTOCOL: {
      default: 'http',
      schema: protocolSchema
    },
    COMMAND_DISPATCHER_HOST_NAME: {
      default: 'command-dispatcher',
      schema: {
        type: 'string',
        format: 'hostname'
      }
    },
    COMMAND_DISPATCHER_PORT: {
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
    LOCK_STORE_OPTIONS: {
      default: {},
      schema: { type: 'object' }
    },
    LOCK_STORE_TYPE: {
      default: 'InMemory',
      schema: { type: 'string' }
    },
    CONSUMER_PROGRESS_STORE_OPTIONS: {
      default: {},
      schema: { type: 'object' }
    },
    CONSUMER_PROGRESS_STORE_TYPE: {
      default: 'InMemory',
      schema: { type: 'string' }
    },
    HEALTH_CORS_ORIGIN: {
      default: '*',
      schema: corsSchema
    },
    HEALTH_PORT: {
      default: 3001,
      schema: portSchema
    },
    CONCURRENT_FLOWS: {
      default: 1,
      schema: {
        type: 'number',
        minimum: 1
      }
    },
    SNAPSHOT_STRATEGY: {
      default: {
        name: 'lowest',
        configuration: {
          revisionLimit: 100,
          durationLimit: 500
        }
      },
      schema: getSnapshotStrategySchema()
    }
  });

  return withCamelCaseKeys(environmentVariables) as Configuration;
};

export {
  getConfiguration
};
