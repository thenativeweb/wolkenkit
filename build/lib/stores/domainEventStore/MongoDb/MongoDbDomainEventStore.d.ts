/// <reference types="node" />
import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { CollectionNames } from './CollectionNames';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { MongoDbDomainEventStoreOptions } from './MongoDbDomainEventStoreOptions';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { Collection, Db, MongoClient } from 'mongodb';
import { Readable } from 'stream';
declare class MongoDbDomainEventStore implements DomainEventStore {
    protected client: MongoClient;
    protected db: Db;
    protected collectionNames: CollectionNames;
    protected collections: {
        domainEvents: Collection<any>;
        snapshots: Collection<any>;
    };
    protected constructor({ client, db, collectionNames, collections }: {
        client: MongoClient;
        db: Db;
        collectionNames: CollectionNames;
        collections: {
            domainEvents: Collection<any>;
            snapshots: Collection<any>;
        };
    });
    protected static onUnexpectedClose(): never;
    static create({ connectionString, collectionNames }: MongoDbDomainEventStoreOptions): Promise<MongoDbDomainEventStore>;
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
    getReplay({ fromTimestamp }?: {
        fromTimestamp?: number;
    }): Promise<Readable>;
    getReplayForAggregate({ aggregateId, fromRevision, toRevision }: {
        aggregateId: string;
        fromRevision?: number;
        toRevision?: number;
    }): Promise<Readable>;
    storeDomainEvents<TDomainEventData extends DomainEventData>({ domainEvents }: {
        domainEvents: DomainEvent<TDomainEventData>[];
    }): Promise<void>;
    getSnapshot<TState extends State>({ aggregateIdentifier }: {
        aggregateIdentifier: AggregateIdentifier;
    }): Promise<Snapshot<TState> | undefined>;
    storeSnapshot<TState extends State>({ snapshot }: {
        snapshot: Snapshot<TState>;
    }): Promise<void>;
    getAggregateIdentifiers(): Promise<Readable>;
    getAggregateIdentifiersByName({ contextName, aggregateName }: {
        contextName: string;
        aggregateName: string;
    }): Promise<Readable>;
    setup(): Promise<void>;
    destroy(): Promise<void>;
}
export { MongoDbDomainEventStore };
