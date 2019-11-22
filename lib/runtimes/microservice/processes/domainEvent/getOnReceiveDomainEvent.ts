import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { OnReceiveDomainEvent } from '../../../../apis/handleDomainEvent/OnReceiveDomainEvent';
import { PublishDomainEvent } from '../../../../apis/observeDomainEvents/PublishDomainEvent';
import { State } from '../../../../common/elements/State';

const logger = flaschenpost.getLogger();

const getOnReceiveDomainEvent = function ({ publishDomainEvent }: {
  publishDomainEvent: PublishDomainEvent;
}): OnReceiveDomainEvent {
  return async function ({ domainEvent }: {
    domainEvent: DomainEventWithState<DomainEventData, State>;
  }): Promise<void> {
    try {
      publishDomainEvent({ domainEvent });

      logger.info('Domain event sent to public API.', { domainEvent });
    } catch (ex) {
      logger.error('Failed to send domain event to public API.', { domainEvent, ex });

      throw new errors.RequestFailed('Failed to send domain event to public API.', {
        cause: ex,
        data: { domainEvent }
      });
    }
  };
};

export { getOnReceiveDomainEvent };
