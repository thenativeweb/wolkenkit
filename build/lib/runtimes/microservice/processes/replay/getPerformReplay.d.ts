import { Client as DomainEventDispatcherClient } from '../../../../apis/handleDomainEvent/http/v2/Client';
import { DomainEventStore } from '../../../../stores/domainEventStore/DomainEventStore';
import { PerformReplay } from '../../../../common/domain/PerformReplay';
declare const getPerformReplay: ({ domainEventStore, domainEventDispatcherClient }: {
    domainEventStore: DomainEventStore;
    domainEventDispatcherClient: DomainEventDispatcherClient;
}) => PerformReplay;
export { getPerformReplay };
