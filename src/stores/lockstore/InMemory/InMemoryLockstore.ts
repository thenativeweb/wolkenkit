import { Lock } from '../Lock';
import { Lockstore } from '../Lockstore';
import { noop } from 'lodash';
import sortKeys from 'sort-keys';

// This value represents the maximum possible date in JavaScript. For details
// see: http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.1
const maxDate = 8_640_000_000_000_000;

class InMemoryLockstore implements Lockstore {
  protected maxLockSize: number;

  protected database: { locks: Lock[] };

  protected constructor ({ maxLockSize }: { maxLockSize: number }) {
    this.maxLockSize = maxLockSize;
    this.database = {
      locks: []
    };
  }

  public static async create ({ maxLockSize = 2048 }: {
    maxLockSize: number;
  }): Promise<InMemoryLockstore> {
    const lockstore = new InMemoryLockstore({ maxLockSize });

    return lockstore;
  }

  protected getLockName ({ namespace, value }: {
    namespace: string;
    value: any;
  }): string {
    const serializedValue = JSON.stringify(sortKeys(value, { deep: true }));

    if (serializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const name = `${namespace}#${serializedValue}`;

    return name;
  }

  public async acquireLock ({
    namespace,
    value,
    expiresAt = maxDate,
    onAcquired = noop
  }: {
    namespace: string;
    value: any;
    expiresAt: number;
    onAcquired (): void | Promise<void>;
  }): Promise<void> {
    const name = this.getLockName({ namespace, value });

    const isLocked = this.database.locks.some(
      (lock): boolean => lock.name === name && Date.now() < lock.expiresAt
    );

    if (isLocked) {
      throw new Error('Failed to acquire lock.');
    }

    const lock = { name, expiresAt };

    this.database.locks.push(lock);

    try {
      await onAcquired();
    } catch (ex) {
      await this.releaseLock({ namespace, value });

      throw ex;
    }
  }

  public async isLocked ({ namespace, value }: {
    namespace: string;
    value: any;
  }): Promise<boolean> {
    const name = this.getLockName({ namespace, value });

    const isLocked = this.database.locks.some(
      (lock): boolean => lock.name === name && Date.now() < lock.expiresAt
    );

    return isLocked;
  }

  public async renewLock ({ namespace, value, expiresAt }: {
    namespace: string;
    value: any;
    expiresAt: number;
  }): Promise<void> {
    const name = this.getLockName({ namespace, value });
    const existingLock = this.database.locks.find(
      (lock): boolean => lock.name === name && Date.now() < lock.expiresAt
    );

    if (!existingLock) {
      throw new Error('Failed to renew lock.');
    }

    existingLock.expiresAt = expiresAt;
  }

  public async releaseLock ({ namespace, value }: {
    namespace: string;
    value: any;
  }): Promise<void> {
    const name = this.getLockName({ namespace, value });
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

module.exports = InMemoryLockstore;
