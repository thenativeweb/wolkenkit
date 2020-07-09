export interface Configuration {
  domainEventStoreOptions: object;
  domainEventStoreType: string;
  healthCorsOrigin: string | string[];
  healthPort: number;
  port: number;
  queryDomainEventsCorsOrigin: string | string[];
  writeDomainEventsCorsOrigin: string | string[];
}
