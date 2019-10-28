import { AggregateIdentifier } from '../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../common/elements/DomainEvent';
import { DomainEventData } from '../../common/elements/DomainEventData';
import { PassThrough } from 'stream';
import { Snapshot } from './Snapshot';
import { State } from '../../common/elements/State';

// All pass through streams in this interface emit objects of type DomainEvent.
export interface DomainEventStore {
  destroy: () => Promise<void>;

  getDomainEventStream: ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision?: number;
    toRevision?: number;
  }) => Promise<PassThrough>;

  getLastDomainEvent: ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }) => Promise<DomainEvent<DomainEventData> | undefined>;

  getReplay: ({ fromRevisionGlobal, toRevisionGlobal }: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
  }) => Promise<PassThrough>;

  getSnapshot: ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }) => Promise<Snapshot<State> | undefined>;

  getUnpublishedDomainEventStream: () => Promise<PassThrough>;

  markDomainEventsAsPublished: ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision: number;
    toRevision: number;
  }) => Promise<void>;

  saveDomainEvents: ({ domainEvents }: {
    domainEvents: DomainEvent<DomainEventData>[];
  }) => Promise<DomainEvent<DomainEventData>[]>;

  saveSnapshot: ({ snapshot }: {
    snapshot: Snapshot<State>;
  }) => Promise<void>;
}
