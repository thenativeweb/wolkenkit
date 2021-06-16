import { InMemoryLockStoreOptions } from './InMemoryLockStoreOptions';
import { Lock } from './Lock';
import { LockStore } from '../LockStore';
declare class InMemoryLockStore implements LockStore {
    protected database: {
        locks: Lock[];
    };
    protected constructor();
    static create(options: InMemoryLockStoreOptions): Promise<InMemoryLockStore>;
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
export { InMemoryLockStore };
