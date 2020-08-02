import { errors } from '../../../common/errors';
import { getHash } from '../../../common/utils/crypto/getHash';
import { InMemoryLockStoreOptions } from './InMemoryLockStoreOptions';
import { Lock } from './Lock';
import { LockStore } from '../LockStore';

class InMemoryLockStore implements LockStore {
  protected database: { locks: Lock[] };

  protected constructor () {
    this.database = {
      locks: []
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static async create (_options: InMemoryLockStoreOptions): Promise<InMemoryLockStore> {
    return new InMemoryLockStore();
  }

  protected async removeExpiredLocks (): Promise<void> {
    this.database.locks = this.database.locks.filter((lock): boolean =>
      lock.expiresAt >= Date.now());
  }

  public async acquireLock ({ value, expiresAt = Number.MAX_SAFE_INTEGER }: {
    value: string;
    expiresAt?: number;
  }): Promise<void> {
    if (expiresAt < Date.now()) {
      throw new errors.ExpirationInPast('A lock must not expire in the past.');
    }

    // From time to time, we should removed expired locks. Doing this before
    // acquiring new ones is a good point in time for this.
    await this.removeExpiredLocks();

    const hash = getHash({ value });
    const isLocked = this.database.locks.some((lock): boolean =>
      lock.value === hash);

    if (isLocked) {
      throw new errors.LockAcquireFailed('Failed to acquire lock.');
    }

    const lock = { value: hash, expiresAt };

    this.database.locks.push(lock);
  }

  public async isLocked ({ value }: {
    value: string;
  }): Promise<boolean> {
    const hash = getHash({ value });

    return this.database.locks.some((lock): boolean =>
      lock.value === hash && Date.now() <= lock.expiresAt);
  }

  public async renewLock ({ value, expiresAt }: {
    value: string;
    expiresAt: number;
  }): Promise<void> {
    if (expiresAt < Date.now()) {
      throw new errors.ExpirationInPast('A lock must not expire in the past.');
    }

    // From time to time, we should removed expired locks. Doing this before
    // renewing existing ones is a good point in time for this.
    await this.removeExpiredLocks();

    const hash = getHash({ value });
    const existingLock = this.database.locks.find((lock): boolean =>
      lock.value === hash);

    if (!existingLock) {
      throw new errors.LockRenewalFailed('Failed to renew lock.');
    }

    existingLock.expiresAt = expiresAt;
  }

  public async releaseLock ({ value }: {
    value: string;
  }): Promise<void> {
    // From time to time, we should removed expired locks. Doing this before
    // releasing existing ones is a good point in time for this.
    await this.removeExpiredLocks();

    const hash = getHash({ value });
    const index = this.database.locks.findIndex((lock): boolean =>
      lock.value === hash);

    if (index === -1) {
      return;
    }

    this.database.locks.splice(index, 1);
  }

  public async destroy (): Promise<void> {
    this.database = {
      locks: []
    };
  }
}

export { InMemoryLockStore };
