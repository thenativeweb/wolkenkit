import { AggregateIdentifier } from '../../elements/AggregateIdentifier';
import { ContextIdentifier } from '../../elements/ContextIdentifier';
import { DomainEvent } from '../../elements/DomainEvent';
import { DomainEventData } from '../../elements/DomainEventData';
import { Initiator } from '../../elements/Initiator';
import { uuid } from 'uuidv4';

const buildDomainEvent = function <TDomainEventData extends DomainEventData> ({
  contextIdentifier,
  aggregateIdentifier,
  name,
  data,
  id,
  metadata
}: {
  contextIdentifier: ContextIdentifier;
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
    contextIdentifier,
    aggregateIdentifier,
    name,
    data,
    id: id ?? uuid(),
    metadata: {
      causationId: metadata.causationId ?? uuid(),
      correlationId: metadata.correlationId ?? uuid(),
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
