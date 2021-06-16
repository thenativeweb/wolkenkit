/// <reference types="node" />
import { AggregateIdentifier } from '../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../common/elements/DomainEvent';
import { DomainEventData } from '../../common/elements/DomainEventData';
import { Readable } from 'stream';
import { Snapshot } from './Snapshot';
import { State } from '../../common/elements/State';
export interface DomainEventStore {
    getLastDomainEvent: <TDomainEventData extends DomainEventData>({ aggregateIdentifier }: {
        aggregateIdentifier: AggregateIdentifier;
    }) => Promise<DomainEvent<TDomainEventData> | undefined>;
    getDomainEventsByCausationId: ({ causationId }: {
        causationId: string;
    }) => Promise<Readable>;
    hasDomainEventsWithCausationId: ({ causationId }: {
        causationId: string;
    }) => Promise<boolean>;
    getDomainEventsByCorrelationId: ({ correlationId }: {
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
    getSnapshot: <TState extends State>({ aggregateIdentifier }: {
        aggregateIdentifier: AggregateIdentifier;
    }) => Promise<Snapshot<TState> | undefined>;
    storeDomainEvents: <TDomainEventData extends DomainEventData>({ domainEvents }: {
        domainEvents: DomainEvent<TDomainEventData>[];
    }) => Promise<void>;
    storeSnapshot: <TState extends State>({ snapshot }: {
        snapshot: Snapshot<TState>;
    }) => Promise<void>;
    getAggregateIdentifiers: () => Promise<Readable>;
    getAggregateIdentifiersByName: ({ contextName, aggregateName }: {
        contextName: string;
        aggregateName: string;
    }) => Promise<Readable>;
    setup: () => Promise<void>;
    destroy: () => Promise<void>;
}
