/// <reference types="node" />
import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { MySqlDomainEventStoreOptions } from './MySqlDomainEventStoreOptions';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { TableNames } from './TableNames';
import { Pool, PoolConnection } from 'mysql';
import { Readable } from 'stream';
declare class MySqlDomainEventStore implements DomainEventStore {
    protected tableNames: TableNames;
    protected pool: Pool;
    protected constructor({ tableNames, pool }: {
        tableNames: TableNames;
        pool: Pool;
    });
    protected static onUnexpectedClose(): never;
    protected static releaseConnection({ connection }: {
        connection: PoolConnection;
    }): void;
    protected getDatabase(): Promise<PoolConnection>;
    static create({ hostName, port, userName, password, database, tableNames }: MySqlDomainEventStoreOptions): Promise<MySqlDomainEventStore>;
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
    setup(): Promise<void>;
    destroy(): Promise<void>;
}
export { MySqlDomainEventStore };
