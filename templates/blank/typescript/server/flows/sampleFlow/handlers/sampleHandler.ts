import { Infrastructure } from '../../../infrastructure';
import { DomainEventData, FlowHandler } from 'wolkenkit';

const sampleHandler: FlowHandler<DomainEventData, Infrastructure> = {
  isRelevant (): boolean {
    return true;
  },

  async handle (domainEvent, { infrastructure, logger }): Promise<void> {
    logger.info('Received domain event.', { domainEvent });

    if (Array.isArray(infrastructure.tell.viewStore.aggregates)) {
      let aggregateToUpdate = infrastructure.tell.viewStore.aggregates.find(
        (aggregate): boolean => aggregate.id === domainEvent.aggregateIdentifier.id
      );

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (aggregateToUpdate) {
        aggregateToUpdate.updatedAt = domainEvent.metadata.timestamp;

        return;
      }

      aggregateToUpdate = {
        id: domainEvent.aggregateIdentifier.id,
        createdAt: domainEvent.metadata.timestamp,
        updatedAt: domainEvent.metadata.timestamp
      };

      infrastructure.tell.viewStore.aggregates.push(aggregateToUpdate);

      return;
    }

    const aggregate = await infrastructure.tell.viewStore.aggregates.findOne(
      { id: domainEvent.aggregateIdentifier.id }
    );

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (aggregate) {
      await infrastructure.tell.viewStore.aggregates.updateOne(
        { id: domainEvent.aggregateIdentifier.id },
        { $set: { updatedAd: domainEvent.metadata.timestamp }}
      );

      return;
    }

    await infrastructure.tell.viewStore.aggregates.insertOne(
      {
        id: domainEvent.aggregateIdentifier.id,
        createdAt: domainEvent.metadata.timestamp,
        updatedAt: domainEvent.metadata.timestamp
      }
    );
  }
};

export { sampleHandler };
