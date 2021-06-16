import { CollectionNames } from './CollectionNames';
import { LockStore } from '../LockStore';
import { MongoDbLockStoreOptions } from './MongoDbLockStoreOptions';
import { Collection, Db, MongoClient } from 'mongodb';
declare class MongoDbLockStore implements LockStore {
    protected client: MongoClient;
    protected db: Db;
    protected collectionNames: CollectionNames;
    protected collections: {
        locks: Collection<any>;
    };
    protected constructor({ client, db, collectionNames, collections }: {
        client: MongoClient;
        db: Db;
        collectionNames: CollectionNames;
        collections: {
            locks: Collection<any>;
        };
    });
    protected static onUnexpectedClose(): never;
    static create({ connectionString, collectionNames }: MongoDbLockStoreOptions): Promise<MongoDbLockStore>;
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
        value: string;
    }): Promise<void>;
    setup(): Promise<void>;
    destroy(): Promise<void>;
}
export { MongoDbLockStore };
