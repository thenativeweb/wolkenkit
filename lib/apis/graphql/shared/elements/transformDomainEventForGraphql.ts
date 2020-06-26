import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';

const transformDomainEventForGraphql = function ({ domainEvent }: {
  domainEvent: DomainEvent<DomainEventData>;
}): any {
  return {
    ...domainEvent,
    data: JSON.stringify(domainEvent.data),
    metadata: {
      ...domainEvent.metadata,
      initiator: {
        user: {
          id: domainEvent.metadata.initiator.user.id
        }
      }
    }
  };
};

export { transformDomainEventForGraphql };
