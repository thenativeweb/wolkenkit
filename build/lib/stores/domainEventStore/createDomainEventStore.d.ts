import { DomainEventStore } from './DomainEventStore';
import { DomainEventStoreOptions } from './DomainEventStoreOptions';
declare const createDomainEventStore: (options: DomainEventStoreOptions) => Promise<DomainEventStore>;
export { createDomainEventStore };
