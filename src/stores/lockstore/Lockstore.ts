export interface Lockstore {
  acquireLock: ({ namespace, value, expiresAt, onAcquired }: {
    namespace: string;
    value: any;
    expiresAt?: number;
    onAcquired? (): void | Promise<void>;
  }) => Promise<void>;

  isLocked: ({ namespace, value }: {
    namespace: string;
    value: any;
  }) => Promise<boolean>;

  renewLock: ({ namespace, value, expiresAt }: {
    namespace: string;
    value: any;
    expiresAt: number;
  }) => Promise<void>;

  releaseLock: ({ namespace, value }: {
    namespace: string;
    value: any;
  }) => Promise<void>;

  destroy: () => Promise<void>;
}
