import { errors } from '../errors';
import { Lock } from './Lock';
import { LockStore } from '../LockStore';
import { javascript as maxDate } from '../../../common/utils/maxDate';

class InMemoryLockStore implements LockStore {
  protected maxLockSize: number;

  protected database: { locks: Lock[] };

  protected constructor ({ maxLockSize }: { maxLockSize: number }) {
    this.maxLockSize = maxLockSize;
    this.database = {
      locks: []
    };
  }

  public static async create ({ maxLockSize = 2048 }: {
    maxLockSize?: number;
  }): Promise<InMemoryLockStore> {
    return new InMemoryLockStore({ maxLockSize });
  }

  public async acquireLock ({
    name,
    expiresAt = maxDate
  }: {
    name: string;
    expiresAt?: number;
  }): Promise<void> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    if (expiresAt - Date.now() < 0) {
      throw new errors.ExpirationInPast('Cannot acquire a lock in the past.');
    }

    const isLocked = this.database.locks.some(
      (lock): boolean => lock.name === name && Date.now() < lock.expiresAt
    );

    if (isLocked) {
      throw new errors.AcquireLockFailed('Failed to acquire lock.');
    }

    const lock = { name, expiresAt };

    this.database.locks.push(lock);
  }

  public async isLocked ({ name }: {
    name: string;
  }): Promise<boolean> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    return this.database.locks.some(
      (lock): boolean => lock.name === name && Date.now() < lock.expiresAt
    );
  }

  public async renewLock ({ name, expiresAt }: {
    name: string;
    expiresAt: number;
  }): Promise<void> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    if (expiresAt - Date.now() < 0) {
      throw new errors.ExpirationInPast('Cannot acquire a lock in the past.');
    }

    const existingLock = this.database.locks.find(
      (lock): boolean => lock.name === name && Date.now() < lock.expiresAt
    );

    if (!existingLock) {
      throw new errors.RenewLockFailed('Failed to renew lock.');
    }

    existingLock.expiresAt = expiresAt;
  }

  public async releaseLock ({ name }: {
    name: string;
  }): Promise<void> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    const index = this.database.locks.findIndex(
      (lock): boolean => lock.name === name
    );

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
