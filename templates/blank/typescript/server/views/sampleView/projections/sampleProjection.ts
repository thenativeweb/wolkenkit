import { ProjectionHandler } from 'wolkenkit';
import { SampleDomainEventData } from '../../../domain/sampleContext/sampleAggregate/domainEvents/sampleDomainEvent';
import { SampleViewItem } from '../SampleViewItem';

export const sampleProjection: ProjectionHandler<SampleViewItem[], SampleDomainEventData> = {
  selector: 'sampleContext.sampleAggregate.sampleDomainEvent',

  async handle (sampleViewItems: any, domainEvent: any): Promise<void> {
    const aggregateId = domainEvent.aggregateIdentifier.id;

    const sampleItem = sampleViewItems.find((item: any): boolean => item.id === aggregateId);

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
