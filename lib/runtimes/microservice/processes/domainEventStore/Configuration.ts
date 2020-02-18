export interface Configuration {
  domainEventStoreOptions: object;
  domainEventStoreType: string;
  queryDomainEventsCorsOrigin: string | string[];
  writeDomainEventsCorsOrigin: string | string[];
  healthCorsOrigin: string | string[];
  port: number;
  healthPort: number;
}
