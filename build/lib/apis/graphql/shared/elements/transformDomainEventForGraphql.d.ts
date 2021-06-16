import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
declare const transformDomainEventForGraphql: ({ domainEvent }: {
    domainEvent: DomainEvent<DomainEventData>;
}) => any;
export { transformDomainEventForGraphql };
