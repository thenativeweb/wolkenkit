export interface LockStore {
    acquireLock: ({ value, expiresAt }: {
        value: string;
        expiresAt?: number;
    }) => Promise<void>;
    isLocked: ({ value }: {
        value: string;
    }) => Promise<boolean>;
    renewLock: ({ value, expiresAt }: {
        value: string;
        expiresAt: number;
    }) => Promise<void>;
    releaseLock: ({ value }: {
        value: string;
    }) => Promise<void>;
    setup: () => Promise<void>;
    destroy: () => Promise<void>;
}
