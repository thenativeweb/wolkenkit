import { ListNames } from './ListNames';
import { LockStore } from '../LockStore';
import { RedisLockStoreOptions } from './RedisLockStoreOptions';
import Redis, { Redis as RedisClient } from 'ioredis';
declare class RedisLockStore implements LockStore {
    protected client: Redis.Redis;
    protected listNames: ListNames;
    protected constructor({ client, listNames }: {
        client: RedisClient;
        listNames: ListNames;
    });
    protected getKey({ value }: {
        value: string;
    }): string;
    protected static getExpiration({ expiresAt }: {
        expiresAt: number;
    }): number;
    protected static onUnexpectedError(): never;
    static create({ hostName, port, password, database, listNames }: RedisLockStoreOptions): Promise<RedisLockStore>;
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
export { RedisLockStore };
