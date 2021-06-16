import { LockStore } from '../LockStore';
import { MySqlLockStoreOptions } from './MySqlLockStoreOptions';
import { TableNames } from './TableNames';
import { Pool, PoolConnection } from 'mysql';
declare class MySqlLockStore implements LockStore {
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
    static create({ hostName, port, userName, password, database, tableNames }: MySqlLockStoreOptions): Promise<MySqlLockStore>;
    protected removeExpiredLocks({ connection }: {
        connection: PoolConnection;
    }): Promise<void>;
    acquireLock({ value, expiresAt }: {
        value: string;
        expiresAt?: number;
    }): Promise<void>;
    isLocked({ value }: {
        value: any;
    }): Promise<boolean>;
    renewLock({ value, expiresAt }: {
        value: string;
        expiresAt: number;
    }): Promise<void>;
    releaseLock({ value }: {
        value: string;
    }): Promise<void>;
    setup(): Promise<void>;
    destroy(): Promise<void>;
}
export { MySqlLockStore };
