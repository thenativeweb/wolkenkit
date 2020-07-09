import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';
import { getProtocolSchema } from '../../../shared/schemas/getProtocolSchema';
import { getSnapshotStrategySchema } from '../../../shared/schemas/getSnapshotStrategySchema';
import path from 'path';

const corsSchema = getCorsSchema(),
      portSchema = getPortSchema(),
      protocolSchema = getProtocolSchema(),
      snapshotStrategySchema = getSnapshotStrategySchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  aeonstoreHostName: {
    environmentVariable: 'AEONSTORE_HOST_NAME',
    defaultValue: 'aeonstore',
    schema: {
      type: 'string',
      format: 'hostname'
    }
  },
  aeonstorePort: {
    environmentVariable: 'AEONSTORE_PORT',
    defaultValue: 3000,
    schema: portSchema
  },
  aeonstoreProtocol: {
    environmentVariable: 'AEONSTORE_PROTOCOL',
    defaultValue: 'http',
    schema: protocolSchema
  },
  applicationDirectory: {
    environmentVariable: 'APPLICATION_DIRECTORY',
    defaultValue: path.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
    schema: {
      type: 'string',
      minLength: 1
    }
  },
  commandDispatcherHostName: {
    environmentVariable: 'COMMAND_DISPATCHER_HOST_NAME',
    defaultValue: 'command-dispatcher',
    schema: {
      type: 'string',
      format: 'hostname'
    }
  },
  commandDispatcherPort: {
    environmentVariable: 'COMMAND_DISPATCHER_PORT',
    defaultValue: 3000,
    schema: portSchema
  },
  commandDispatcherProtocol: {
    environmentVariable: 'COMMAND_DISPATCHER_PROTOCOL',
    defaultValue: 'http',
    schema: protocolSchema
  },
  concurrentFlows: {
    environmentVariable: 'CONCURRENT_FLOWS',
    defaultValue: 1,
    schema: {
      type: 'number',
      minimum: 1
    }
  },
  consumerProgressStoreOptions: {
    environmentVariable: 'CONSUMER_PROGRESS_STORE_OPTIONS',
    defaultValue: {},
    schema: { type: 'object' }
  },
  consumerProgressStoreType: {
    environmentVariable: 'CONSUMER_PROGRESS_STORE_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string' }
  },
  domainEventDispatcherAcknowledgeRetries: {
    environmentVariable: 'DOMAIN_EVENT_DISPATCHER_ACKNOWLEDGE_RETRIES',
    defaultValue: 5,
    schema: { type: 'integer' }
  },
  domainEventDispatcherHostName: {
    environmentVariable: 'DOMAIN_EVENT_DISPATCHER_HOST_NAME',
    defaultValue: 'domain-event-dispatcher',
    schema: {
      type: 'string',
      format: 'hostname'
    }
  },
  domainEventDispatcherPort: {
    environmentVariable: 'DOMAIN_EVENT_DISPATCHER_PORT',
    defaultValue: 3000,
    schema: portSchema
  },
  domainEventDispatcherProtocol: {
    environmentVariable: 'DOMAIN_EVENT_DISPATCHER_PROTOCOL',
    defaultValue: 'http',
    schema: protocolSchema
  },
  domainEventDispatcherRenewInterval: {
    environmentVariable: 'DOMAIN_EVENT_DISPATCHER_RENEW_INTERVAL',
    defaultValue: 5_000,
    schema: { type: 'integer' }
  },
  healthCorsOrigin: {
    environmentVariable: 'HEALTH_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  healthPort: {
    environmentVariable: 'HEALTH_PORT',
    defaultValue: 3001,
    schema: portSchema
  },
  lockStoreOptions: {
    environmentVariable: 'LOCK_STORE_OPTIONS',
    defaultValue: {},
    schema: { type: 'object' }
  },
  lockStoreType: {
    environmentVariable: 'LOCK_STORE_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string' }
  },
  replayServerHostName: {
    environmentVariable: 'REPLAY_SERVER_HOST_NAME',
    defaultValue: 'replay',
    schema: {
      type: 'string',
      format: 'hostname'
    }
  },
  replayServerPort: {
    environmentVariable: 'REPLAY_SERVER_PORT',
    defaultValue: 3000,
    schema: portSchema
  },
  replayServerProtocol: {
    environmentVariable: 'REPLAY_SERVER_PROTOCOL',
    defaultValue: 'http',
    schema: protocolSchema
  },
  snapshotStrategy: {
    environmentVariable: 'SNAPSHOT_STRATEGY',
    defaultValue: {
      name: 'lowest',
      configuration: {
        revisionLimit: 100,
        durationLimit: 500
      }
    },
    schema: snapshotStrategySchema
  }
};

export { configurationDefinition };
