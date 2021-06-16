/// <reference types="node" />
import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { PostgresDomainEventStoreOptions } from './PostgresDomainEventStoreOptions';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { TableNames } from './TableNames';
import { Client, Pool, PoolClient } from 'pg';
import { Readable } from 'stream';
declare class PostgresDomainEventStore implements DomainEventStore {
    protected pool: Pool;
    protected tableNames: TableNames;
    protected disconnectWatcher: Client;
    protected static onUnexpectedClose(): never;
    protected getDatabase(): Promise<PoolClient>;
    protected constructor({ pool, tableNames, disconnectWatcher }: {
        pool: Pool;
        tableNames: TableNames;
        disconnectWatcher: Client;
    });
    static create({ hostName, port, userName, password, database, encryptConnection, tableNames }: PostgresDomainEventStoreOptions): Promise<PostgresDomainEventStore>;
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
        fromTimestamp?: number | undefined;
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
    storeSnapshot({ snapshot }: {
        snapshot: Snapshot<State>;
    }): Promise<void>;
    getAggregateIdentifiers(): Promise<Readable>;
    getAggregateIdentifiersByName({ contextName, aggregateName }: {
        contextName: string;
        aggregateName: string;
    }): Promise<Readable>;
    setup(): Promise<void>;
    destroy(): Promise<void>;
}
export { PostgresDomainEventStore };
