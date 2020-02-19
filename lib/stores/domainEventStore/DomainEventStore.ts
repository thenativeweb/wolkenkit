import { AggregateIdentifier } from '../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../common/elements/DomainEvent';
import { DomainEventData } from '../../common/elements/DomainEventData';
import { Readable } from 'stream';
import { Snapshot } from './Snapshot';
import { State } from '../../common/elements/State';

// All pass through streams in this interface emit objects of type DomainEvent.
export interface DomainEventStore {
  getLastDomainEvent: <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }) => Promise<DomainEvent<TDomainEventData> | undefined>;

  getDomainEventsByCausationId: <TDomainEventData extends DomainEventData> ({ causationId }: {
    causationId: string;
  }) => Promise<Readable>;

  hasDomainEventsWithCausationId: <TDomainEventData extends DomainEventData> ({ causationId }: {
    causationId: string;
  }) => Promise<boolean>;

  getDomainEventsByCorrelationId: <TDomainEventData extends DomainEventData> ({ correlationId }: {
    correlationId: string;
  }) => Promise<Readable>;

  getReplay: ({ fromRevisionGlobal, toRevisionGlobal }: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
  }) => Promise<Readable>;

  getReplayForAggregate: ({ aggregateId, fromRevision, toRevision }: {
    aggregateId: string;
    fromRevision?: number;
    toRevision?: number;
  }) => Promise<Readable>;

  getSnapshot: <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }) => Promise<Snapshot<TState> | undefined>;

  storeDomainEvents: <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }) => Promise<DomainEvent<TDomainEventData>[]>;

  storeSnapshot: <TState extends State> ({ snapshot }: {
    snapshot: Snapshot<TState>;
  }) => Promise<void>;

  destroy: () => Promise<void>;
}
