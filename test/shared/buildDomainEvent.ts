import { AggregateIdentifier } from '../../lib/common/elements/AggregateIdentifier';
import { ContextIdentifier } from '../../lib/common/elements/ContextIdentifier';
import { DomainEvent } from '../../lib/common/elements/DomainEvent';
import { DomainEventData } from '../../lib/common/elements/DomainEventData';
import { Initiator } from '../../lib/common/elements/Initiator';
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
    isPublished?: boolean;
    revision: {
      aggregate: number;
      global?: number | null;
    };
    initiator: Initiator;
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
      isPublished: metadata.isPublished ?? false,
      revision: {
        aggregate: metadata.revision.aggregate,
        global: metadata.revision.global ?? null
      },
      initiator: metadata.initiator,
      tags: metadata.tags ?? []
    }
  });
};

export { buildDomainEvent };
