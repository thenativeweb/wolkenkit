import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getPortOrSocketSchema } from '../../../shared/schemas/getPortOrSocketSchema';
import { getPublisherOptionsSchema } from '../../../shared/schemas/getPublisherOptionsSchema';
import { getSubscriberOptionsSchema } from '../../../shared/schemas/getSubscriberOptionsSchema';

const corsSchema = getCorsSchema(),
      portOrSocketSchema = getPortOrSocketSchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  healthCorsOrigin: {
    environmentVariable: 'HEALTH_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  healthPortOrSocket: {
    environmentVariable: 'HEALTH_PORT_OR_SOCKET',
    defaultValue: 3_001,
    schema: portOrSocketSchema
  },
  portOrSocket: {
    environmentVariable: 'PORT_OR_SOCKET',
    defaultValue: 3_000,
    schema: portOrSocketSchema
  },
  publishCorsOrigin: {
    environmentVariable: 'PUBLISH_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  pubSubOptions: {
    environmentVariable: 'PUB_SUB_OPTIONS',
    defaultValue: {
      subscriber: { type: 'InMemory' },
      publisher: { type: 'InMemory' }
    },
    schema: {
      type: 'object',
      properties: {
        subscriber: getSubscriberOptionsSchema(),
        publisher: getPublisherOptionsSchema()
      },
      required: [ 'subscriber', 'publisher' ],
      additionalProperties: false
    }
  },
  subscribeCorsOrigin: {
    environmentVariable: 'SUBSCRIBE_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  }
};

export { configurationDefinition };
