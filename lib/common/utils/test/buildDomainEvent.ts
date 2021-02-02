import { AggregateIdentifier } from '../../elements/AggregateIdentifier';
import { DomainEvent } from '../../elements/DomainEvent';
import { DomainEventData } from '../../elements/DomainEventData';
import { Initiator } from '../../elements/Initiator';
import { v4 } from 'uuid';

const buildDomainEvent = function <TDomainEventData extends DomainEventData> ({
  aggregateIdentifier,
  name,
  data,
  id,
  metadata
}: {
  aggregateIdentifier: AggregateIdentifier;
  name: string;
  data: TDomainEventData;
  id?: string;
  metadata: {
    causationId?: string;
    correlationId?: string;
    timestamp?: number;
    revision: number;
    initiator?: Initiator;
    tags?: string[];
  };
}): DomainEvent<TDomainEventData> {
  return new DomainEvent({
    aggregateIdentifier,
    name,
    data,
    id: id ?? v4(),
    metadata: {
      causationId: metadata.causationId ?? v4(),
      correlationId: metadata.correlationId ?? v4(),
      timestamp: metadata.timestamp ?? Date.now(),
      revision: metadata.revision,
      initiator: metadata.initiator ?? {
        user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}
      },
      tags: metadata.tags ?? []
    }
  });
};

export { buildDomainEvent };
