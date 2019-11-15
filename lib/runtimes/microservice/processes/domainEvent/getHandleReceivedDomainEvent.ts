import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { DomainEventWithState } from '../../../../common/elements/DomainEventWithState';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { Http } from '../../../../apis/domainEventPublisher/Http';
import { OnReceiveDomainEvent } from '../../../../apis/domainEventReceiver/OnReceiveDomainEvent';
import { State } from '../../../../common/elements/State';

const logger = flaschenpost.getLogger();

const getHandleReceivedDomainEvent = function ({ domainEventPublisherHttp }: {
  domainEventPublisherHttp: Http;
}): OnReceiveDomainEvent {
  return async function ({ domainEvent }: {
    domainEvent: DomainEventWithState<DomainEventData, State>;
  }): Promise<void> {
    try {
      await domainEventPublisherHttp.publishDomainEvent({ domainEvent });

      logger.info('Domain event forwarded to publisher API.', { domainEvent });
    } catch (ex) {
      logger.error('Failed to forward domain event to publisher API.', { domainEvent, ex });

      throw new errors.ForwardFailed();
    }
  };
};

export { getHandleReceivedDomainEvent };
