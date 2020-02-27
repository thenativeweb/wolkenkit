import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';

const transformDomainEventForGraphql = function ({ domainEvent }: {
  domainEvent: DomainEvent<DomainEventData>;
}): any {
  return {
    contextIdentifier: domainEvent.contextIdentifier,
    aggregateIdentifier: domainEvent.aggregateIdentifier,
    name: domainEvent.name,
    id: domainEvent.id,
    data: JSON.stringify(domainEvent.data),
    metadata: {
      causationId: domainEvent.metadata.causationId,
      correlationId: domainEvent.metadata.correlationId,
      timestamp: domainEvent.metadata.timestamp,
      revision: domainEvent.metadata.revision,
      initiator: {
        user: {
          id: domainEvent.metadata.initiator.user.id
        }
      },
      tags: domainEvent.metadata.tags
    }
  };
};

export { transformDomainEventForGraphql };
