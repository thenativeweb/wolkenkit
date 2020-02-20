import { ProjectionHandler } from 'wolkenkit';
import { SampleDomainEventData } from '../../../domain/sampleContext/sampleAggregate/domainEvents/sampleDomainEvent';
import { SampleViewItem } from '../SampleViewItem';

export const sampleProjection: ProjectionHandler<SampleViewItem[], SampleDomainEventData> = {
  selector: 'sampleContext.sampleAggregate.sampleDomainEvent',

  async handle (sampleViewItems, domainEvent): Promise<void> {
    const aggregateId = domainEvent.aggregateIdentifier.id;

    const sampleItem = sampleViewItems.find((sampleItem): boolean => sampleItem.id === aggregateId);

    if (!sampleItem) {
      sampleViewItems.push({
        id: aggregateId,
        createdAt: domainEvent.metadata.timestamp
      });

      return;
    }

    sampleItem.updatedAt = domainEvent.metadata.timestamp;
  }
};
