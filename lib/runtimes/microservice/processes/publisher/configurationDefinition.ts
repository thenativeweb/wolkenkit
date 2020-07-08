import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';

const corsSchema = getCorsSchema(),
      portSchema = getPortSchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
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
  port: {
    environmentVariable: 'PORT',
    defaultValue: 3000,
    schema: portSchema
  },
  publishCorsOrigin: {
    environmentVariable: 'PUBLISH_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  pubSubOptions: {
    environmentVariable: 'PUB_SUB_OPTIONS',
    defaultValue: { subscriber: {}, publisher: {}},
    schema: {
      type: 'object',
      properties: {
        subscriber: { type: 'object' },
        publisher: { type: 'object' }
      },
      required: [ 'subscriber', 'publisher' ],
      additionalProperties: false
    }
  },
  pubSubType: {
    environmentVariable: 'PUB_SUB_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string', minLength: 1 }
  },
  subscribeCorsOrigin: {
    environmentVariable: 'SUBSCRIBE_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  }
};

export { configurationDefinition };
