import { Application } from '../../../../common/application/Application';
import { DomainEvent } from '../../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../../common/elements/DomainEventData';
import { errors } from '../../../../common/errors';
import { flaschenpost } from 'flaschenpost';
import { ItemIdentifierWithClient } from '../../../../common/elements/ItemIdentifierWithClient';
import { OnReceiveDomainEvent } from '../../../../apis/handleDomainEvent/OnReceiveDomainEvent';
import { PriorityQueueStore } from '../../../../stores/priorityQueueStore/PriorityQueueStore';
import { Publisher } from '../../../../messaging/pubSub/Publisher';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';

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
    try {
      logger.debug(
        'Enqueueing domain event in priority queue...',
        withLogMetadata('runtime', 'microservice/domainEventDispatcher', { domainEvent })
      );

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

      logger.debug(
        'Enqueued domain event in priority queue.',
        withLogMetadata('runtime', 'microservice/domainEventDispatcher', { domainEvent })
      );
    } catch (ex) {
      logger.error(
        'Failed to enqueue domain event in priority queue.',
        withLogMetadata(
          'runtime',
          'microservice/domainEventDispatcher',
          { domainEvent, err: ex }
        )
      );

      throw new errors.RequestFailed('Failed to enqueue domain event in priority queue.', {
        cause: ex,
        data: { domainEvent }
      });
    }
  };
};

export { getOnReceiveDomainEvent };
