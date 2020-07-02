import { Application } from '../../../../common/application/Application';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { flaschenpost } from 'flaschenpost';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnReceiveDomainEvent } from '../../../../apis/handleDomainEvent/OnReceiveDomainEvent';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Publisher } from '../../../../messaging/pubSub/Publisher';

const logger = flaschenpost.getLogger();

const getOnReceiveDomainEvent = function ({
  application,
  priorityQueueStore,
  newDomainEventPublisher,
  newDomainEventPubSubChannel
}: {
  application: Application;
  priorityQueueStore: PriorityQueueStore<DomainEvent<DomainEventData>, ItemIdentifierWithClient>;
  newDomainEventPublisher: Publisher<object>;
  newDomainEventPubSubChannel: string;
}): OnReceiveDomainEvent {
  return async function ({ domainEvent }): Promise<void> {
    logger.debug('Received domain event, enqueueing it.', { domainEvent });

    for (const flowName of Object.keys(application.flows)) {
      await priorityQueueStore.enqueue({
        item: domainEvent,
        discriminator: flowName,
        priority: domainEvent.metadata.timestamp
      });
    }
    await newDomainEventPublisher.publish({
      channel: newDomainEventPubSubChannel,
      message: {}
    });
  };
};

export { getOnReceiveDomainEvent };
