import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { IsReplaying } from '../IsReplaying';
import { MySqlConsumerProgressStoreOptions } from './MySqlConsumerProgressStoreOptions';
import { TableNames } from './TableNames';
import { Pool, PoolConnection } from 'mysql';
declare class MySqlConsumerProgressStore implements ConsumerProgressStore {
    protected pool: Pool;
    protected tableNames: TableNames;
    protected constructor({ tableNames, pool }: {
        tableNames: TableNames;
        pool: Pool;
    });
    protected static onUnexpectedClose(): never;
    protected static releaseConnection({ connection }: {
        connection: PoolConnection;
    }): void;
    protected getDatabase(): Promise<PoolConnection>;
    static create({ hostName, port, userName, password, database, tableNames }: MySqlConsumerProgressStoreOptions): Promise<MySqlConsumerProgressStore>;
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
export { MySqlConsumerProgressStore };
