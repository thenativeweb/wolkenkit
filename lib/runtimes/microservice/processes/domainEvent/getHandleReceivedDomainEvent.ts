import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveDomainEvent } from '../../../../apis/handleDomainEvent/OnReceiveDomainEvent';
import { PublishDomainEvent } from '../../../../apis/observeDomainEvents/PublishDomainEvent';
import { State } from '../../../../common/elements/State';

const logger = flaschenpost.getLogger();

const getHandleReceivedDomainEvent = function ({ publishDomainEvent }: {
  publishDomainEvent: PublishDomainEvent;
}): OnReceiveDomainEvent {
  return async function ({ domainEvent }: {
    domainEvent: DomainEventWithState<DomainEventData, State>;
  }): Promise<void> {
    try {
      publishDomainEvent({ domainEvent });

      logger.info('Domain event forwarded to publisher API.', { domainEvent });
    } catch (ex) {
      logger.error('Failed to forward domain event to publisher API.', { domainEvent, ex });

      throw new errors.ForwardFailed();
    }
  };
};

export { getHandleReceivedDomainEvent };
