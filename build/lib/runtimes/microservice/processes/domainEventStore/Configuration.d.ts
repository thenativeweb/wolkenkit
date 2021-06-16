import { DomainEventStoreOptions } from '../../../../stores/domainEventStore/DomainEventStoreOptions';
export interface Configuration {
    domainEventStoreOptions: DomainEventStoreOptions;
    healthCorsOrigin: string | string[];
    healthPortOrSocket: number | string;
    portOrSocket: number | string;
    queryDomainEventsCorsOrigin: string | string[];
    writeDomainEventsCorsOrigin: string | string[];
}
