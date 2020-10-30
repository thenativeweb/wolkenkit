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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDomainEventsByCausationId: <TDomainEventData extends DomainEventData> ({ causationId }: {
    causationId: string;
  }) => Promise<Readable>;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hasDomainEventsWithCausationId: <TDomainEventData extends DomainEventData> ({ causationId }: {
    causationId: string;
  }) => Promise<boolean>;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDomainEventsByCorrelationId: <TDomainEventData extends DomainEventData> ({ correlationId }: {
    correlationId: string;
  }) => Promise<Readable>;

  getReplay: ({ fromTimestamp }: {
    fromTimestamp?: number;
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
  }) => Promise<void>;

  storeSnapshot: <TState extends State> ({ snapshot }: {
    snapshot: Snapshot<TState>;
  }) => Promise<void>;

  setup: () => Promise<void>;

  destroy: () => Promise<void>;
}
