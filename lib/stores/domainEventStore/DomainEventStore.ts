import { AggregateIdentifier } from '../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../common/elements/DomainEvent';
import { DomainEventData } from '../../common/elements/DomainEventData';
import { PassThrough } from 'stream';
import { Snapshot } from './Snapshot';
import { State } from '../../common/elements/State';

// All pass through streams in this interface emit objects of type DomainEvent.
export interface DomainEventStore {
  getLastDomainEvent: <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }) => Promise<DomainEvent<TDomainEventData> | undefined>;

  getDomainEventStream: ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision?: number;
    toRevision?: number;
  }) => Promise<PassThrough>;

  getUnpublishedDomainEventStream: () => Promise<PassThrough>;

  saveDomainEvents: <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }) => Promise<DomainEvent<TDomainEventData>[]>;

  markDomainEventsAsPublished: ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision: number;
    toRevision: number;
  }) => Promise<void>;

  getSnapshot: <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }) => Promise<Snapshot<TState> | undefined>;

  saveSnapshot: <TState extends State> ({ snapshot }: {
    snapshot: Snapshot<TState>;
  }) => Promise<void>;

  getReplay: ({ fromRevisionGlobal, toRevisionGlobal }: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
  }) => Promise<PassThrough>;

  destroy: () => Promise<void>;
}
