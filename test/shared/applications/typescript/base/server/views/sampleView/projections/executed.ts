import { ExecutedData } from '../../../domain/sampleContext/sampleAggregate/domainEvents/executed';
// @ts-ignore
import { ProjectionHandler } from 'wolkenkit';
import { SampleViewItem } from '../SampleViewItem';

export const executed: ProjectionHandler<SampleViewItem[], ExecutedData> = {
  selector: 'sampleContext.sampleAggregate.executed',

  async handle (sampleViewItems: any, domainEvent: any): Promise<void> {
    const aggregateId = domainEvent.aggregateIdentifier.id;

    const sampleItem = sampleViewItems.find((item: any): boolean => item.id === aggregateId);

    if (!sampleItem) {
      sampleViewItems.push({
        id: aggregateId,
        createdAt: domainEvent.metadata.timestamp,
        strategy: domainEvent.data.strategy
      });

      return;
    }

    sampleItem.updatedAt = domainEvent.metadata.timestamp;
  }
};
