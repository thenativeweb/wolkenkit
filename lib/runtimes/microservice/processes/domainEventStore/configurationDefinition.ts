import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getPortSchema } from '../../../shared/schemas/getPortSchema';

const corsSchema = getCorsSchema();
const portSchema = getPortSchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  domainEventStoreOptions: {
    environmentVariable: 'DOMAIN_EVENT_STORE_OPTIONS',
    defaultValue: {},
    schema: { type: 'object' }
  },
  domainEventStoreType: {
    environmentVariable: 'DOMAIN_EVENT_STORE_TYPE',
    defaultValue: 'InMemory',
    schema: { type: 'string', minLength: 1 }
  },
  healthCorsOrigin: {
    environmentVariable: 'HEALTH_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  healthPort: {
    environmentVariable: 'HEALTH_PORT',
    defaultValue: 3_001,
    schema: portSchema
  },
  port: {
    environmentVariable: 'PORT',
    defaultValue: 3_000,
    schema: portSchema
  },
  queryDomainEventsCorsOrigin: {
    environmentVariable: 'QUERY_DOMAIN_EVENTS_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  },
  writeDomainEventsCorsOrigin: {
    environmentVariable: 'WRITE_DOMAIN_EVENTS_CORS_ORIGIN',
    defaultValue: '*',
    schema: corsSchema
  }
};

export { configurationDefinition };
