import { Configuration } from './Configuration';
import { ConfigurationDefinition } from '../../../shared/ConfigurationDefinition';
import { getCorsSchema } from '../../../shared/schemas/getCorsSchema';
import { getDomainEventStoreOptionsSchema } from '../../../shared/schemas/getDomainEventStoreOptionsSchema';
import { getPortOrSocketSchema } from '../../../shared/schemas/getPortOrSocketSchema';

const corsSchema = getCorsSchema(),
      domainEventStoreOptionsSchema = getDomainEventStoreOptionsSchema(),
      portOrSocketSchema = getPortOrSocketSchema();

const configurationDefinition: ConfigurationDefinition<Configuration> = {
  domainEventStoreOptions: {
    environmentVariable: 'DOMAIN_EVENT_STORE_OPTIONS',
    defaultValue: { type: 'InMemory' },
    schema: domainEventStoreOptionsSchema
  },
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
