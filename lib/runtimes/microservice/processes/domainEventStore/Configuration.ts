export interface Configuration {
  domainEventStoreOptions: object;
  domainEventStoreType: string;
  pubSubType: string;
  pubSubOptions: {
    channel: string;
    subscriber: object;
    publisher: object;
  };
  queryDomainEventsCorsOrigin: string | string[];
  writeDomainEventsCorsOrigin: string | string[];
  healthCorsOrigin: string | string[];
  port: number;
}
