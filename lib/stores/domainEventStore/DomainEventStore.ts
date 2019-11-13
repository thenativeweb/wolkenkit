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

  getLastDomainEvent: <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }) => Promise<DomainEvent<TDomainEventData> | undefined>;

  getReplay: ({ fromRevisionGlobal, toRevisionGlobal }: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
  }) => Promise<PassThrough>;

  getSnapshot: <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }) => Promise<Snapshot<TState> | undefined>;

  getUnpublishedDomainEventStream: () => Promise<PassThrough>;

  markDomainEventsAsPublished: ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision: number;
    toRevision: number;
  }) => Promise<void>;

  saveDomainEvents: <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }) => Promise<DomainEvent<TDomainEventData>[]>;

  saveSnapshot: <TState extends State> ({ snapshot }: {
    snapshot: Snapshot<TState>;
  }) => Promise<void>;
}
