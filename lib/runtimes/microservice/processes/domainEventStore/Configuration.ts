import { DomainEventStoreOptions } from '../../../../stores/domainEventStore/DomainEventStoreOptions';

export interface Configuration {
  domainEventStoreOptions: DomainEventStoreOptions;
  healthCorsOrigin: string | string[];
  healthPort: number;
  port: number;
  queryDomainEventsCorsOrigin: string | string[];
  writeDomainEventsCorsOrigin: string | string[];
}
