import { LockStore } from '../LockStore';
import { PostgresLockStoreOptions } from './PostgresLockStoreOptions';
import { TableNames } from './TableNames';
import { Client, Pool, PoolClient } from 'pg';
declare class PostgresLockStore implements LockStore {
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
    static create({ hostName, port, userName, password, database, encryptConnection, tableNames }: PostgresLockStoreOptions): Promise<PostgresLockStore>;
    protected removeExpiredLocks({ connection }: {
        connection: PoolClient;
    }): Promise<void>;
    acquireLock({ value, expiresAt }: {
        value: string;
        expiresAt?: number;
    }): Promise<void>;
    isLocked({ value }: {
        value: string;
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
export { PostgresLockStore };
