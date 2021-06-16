import { LockStore } from '../LockStore';
import { SqlServerLockStoreOptions } from './SqlServerLockStoreOptions';
import { TableNames } from './TableNames';
import { ConnectionPool } from 'mssql';
declare class SqlServerLockStore implements LockStore {
    protected pool: ConnectionPool;
    protected tableNames: TableNames;
    protected static onUnexpectedClose(): never;
    protected constructor({ pool, tableNames }: {
        pool: ConnectionPool;
        tableNames: TableNames;
    });
    static create({ hostName, port, userName, password, database, encryptConnection, tableNames }: SqlServerLockStoreOptions): Promise<SqlServerLockStore>;
    protected removeExpiredLocks(): Promise<void>;
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
        value: any;
    }): Promise<void>;
    setup(): Promise<void>;
    destroy(): Promise<void>;
}
export { SqlServerLockStore };
