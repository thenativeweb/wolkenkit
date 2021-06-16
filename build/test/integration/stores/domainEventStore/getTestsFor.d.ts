import { DomainEventStore } from '../../../../lib/stores/domainEventStore/DomainEventStore';
declare const getTestsFor: ({ createDomainEventStore, teardownDomainEventStore }: {
    createDomainEventStore: ({ suffix }: {
        suffix: string;
    }) => Promise<DomainEventStore>;
    teardownDomainEventStore?: (({ suffix }: {
        suffix: string;
    }) => Promise<void>) | undefined;
}) => void;
export { getTestsFor };
