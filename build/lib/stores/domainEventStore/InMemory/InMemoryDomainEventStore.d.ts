/// <reference types="node" />
import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { InMemoryDomainEventStoreOptions } from './InMemoryDomainEventStoreOptions';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { Readable } from 'stream';
declare class InMemoryDomainEventStore implements DomainEventStore {
    protected domainEvents: DomainEvent<DomainEventData>[];
    protected snapshots: Snapshot<State>[];
    protected constructor();
    static create(options: InMemoryDomainEventStoreOptions): Promise<InMemoryDomainEventStore>;
    getLastDomainEvent<TDomainEventData extends DomainEventData>({ aggregateIdentifier }: {
        aggregateIdentifier: AggregateIdentifier;
    }): Promise<DomainEvent<TDomainEventData> | undefined>;
    getDomainEventsByCausationId({ causationId }: {
        causationId: string;
    }): Promise<Readable>;
    hasDomainEventsWithCausationId({ causationId }: {
        causationId: string;
    }): Promise<boolean>;
    getDomainEventsByCorrelationId({ correlationId }: {
        correlationId: string;
    }): Promise<Readable>;
    getReplay({ fromTimestamp }: {
        fromTimestamp?: number;
    }): Promise<Readable>;
    getReplayForAggregate({ aggregateId, fromRevision, toRevision }: {
        aggregateId: string;
        fromRevision?: number;
        toRevision?: number;
    }): Promise<Readable>;
    getSnapshot<TState extends State>({ aggregateIdentifier }: {
        aggregateIdentifier: AggregateIdentifier;
    }): Promise<Snapshot<TState> | undefined>;
    storeDomainEvents<TDomainEventData extends DomainEventData>({ domainEvents }: {
        domainEvents: DomainEvent<TDomainEventData>[];
    }): Promise<void>;
    storeSnapshot({ snapshot }: {
        snapshot: Snapshot<State>;
    }): Promise<void>;
    getAggregateIdentifiers(): Promise<Readable>;
    getAggregateIdentifiersByName({ contextName, aggregateName }: {
        contextName: string;
        aggregateName: string;
    }): Promise<Readable>;
    protected getStoredDomainEvents<TState extends State>(): DomainEvent<TState>[];
    protected getStoredSnapshots(): Snapshot<State>[];
    protected storeDomainEventAtDatabase({ domainEvent }: {
        domainEvent: DomainEvent<State>;
    }): void;
    protected storeSnapshotAtDatabase({ snapshot }: {
        snapshot: Snapshot<State>;
    }): void;
    setup(): Promise<void>;
    destroy(): Promise<void>;
}
export { InMemoryDomainEventStore };
