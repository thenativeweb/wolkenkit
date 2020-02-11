export interface LockService {
  acquireLock: ({ name, expiresAt }: {
    name: string;
    expiresAt?: number;
  }) => Promise<void>;

  isLocked: ({ name }: {
    name: string;
  }) => Promise<boolean>;

  renewLock: ({ name, expiresAt }: {
    name: string;
    expiresAt: number;
  }) => Promise<void>;

  releaseLock: ({ name }: {
    name: string;
  }) => Promise<void>;
}
