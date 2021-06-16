import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { IsReplaying } from '../IsReplaying';
import { PostgresConsumerProgressStoreOptions } from './PostgresConsumerProgressStoreOptions';
import { TableNames } from './TableNames';
import { Client, Pool, PoolClient } from 'pg';
declare class PostgresConsumerProgressStore implements ConsumerProgressStore {
    protected tableNames: TableNames;
    protected pool: Pool;
    protected disconnectWatcher: Client;
    protected static onUnexpectedClose(): never;
    protected static getDatabase(pool: Pool): Promise<PoolClient>;
    protected constructor({ tableNames, pool, disconnectWatcher }: {
        tableNames: TableNames;
        pool: Pool;
        disconnectWatcher: Client;
    });
    static create({ hostName, port, userName, password, database, encryptConnection, tableNames }: PostgresConsumerProgressStoreOptions): Promise<PostgresConsumerProgressStore>;
    getProgress({ consumerId, aggregateIdentifier }: {
        consumerId: string;
        aggregateIdentifier: AggregateIdentifier;
    }): Promise<{
        revision: number;
        isReplaying: IsReplaying;
    }>;
    setProgress({ consumerId, aggregateIdentifier, revision }: {
        consumerId: string;
        aggregateIdentifier: AggregateIdentifier;
        revision: number;
    }): Promise<void>;
    setIsReplaying({ consumerId, aggregateIdentifier, isReplaying }: {
        consumerId: string;
        aggregateIdentifier: AggregateIdentifier;
        isReplaying: IsReplaying;
    }): Promise<void>;
    resetProgress({ consumerId }: {
        consumerId: string;
    }): Promise<void>;
    resetProgressToRevision({ consumerId, aggregateIdentifier, revision }: {
        consumerId: string;
        aggregateIdentifier: AggregateIdentifier;
        revision: number;
    }): Promise<void>;
    setup(): Promise<void>;
    destroy(): Promise<void>;
}
export { PostgresConsumerProgressStore };
