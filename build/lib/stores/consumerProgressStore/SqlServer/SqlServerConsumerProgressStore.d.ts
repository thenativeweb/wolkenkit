import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { IsReplaying } from '../IsReplaying';
import { SqlServerConsumerProgressStoreOptions } from './SqlServerConsumerProgressStoreOptions';
import { TableNames } from './TableNames';
import { ConnectionPool } from 'mssql';
declare class SqlServerConsumerProgressStore implements ConsumerProgressStore {
    protected pool: ConnectionPool;
    protected tableNames: TableNames;
    protected static onUnexpectedClose(): never;
    protected constructor({ pool, tableNames }: {
        pool: ConnectionPool;
        tableNames: TableNames;
    });
    static create({ hostName, port, userName, password, database, encryptConnection, tableNames }: SqlServerConsumerProgressStoreOptions): Promise<SqlServerConsumerProgressStore>;
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
export { SqlServerConsumerProgressStore };
