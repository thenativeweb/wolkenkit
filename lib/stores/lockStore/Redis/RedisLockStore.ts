import { errors } from '../../../common/errors';
import { getHash } from '../../../common/utils/crypto/getHash';
import { ListNames } from './ListNames';
import { LockStore } from '../LockStore';
import { RedisLockStoreOptions } from './RedisLockStoreOptions';
import { retry } from 'retry-ignore-abort';
import Redis, { Redis as RedisClient } from 'ioredis';

class RedisLockStore implements LockStore {
  protected client: Redis.Redis;

  protected listNames: ListNames;

  protected constructor ({ client, listNames }: {
    client: RedisClient;
    listNames: ListNames;
  }) {
    this.client = client;
    this.listNames = listNames;
  }

  protected getKey ({ value }: {
    value: string;
  }): string {
    const hash = getHash({ value });
    const key = `${this.listNames.locks}_${hash}`;

    return key;
  }

  protected static getExpiration ({ expiresAt }: {
    expiresAt: number;
  }): number {
    return expiresAt - Date.now();
  }

  protected static onUnexpectedError (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  public static async create ({
    hostName,
    port,
    password,
    database,
    listNames
  }: RedisLockStoreOptions): Promise<RedisLockStore> {
    const client = await retry(async (): Promise<RedisClient> => {
      const redis = new Redis({
        host: hostName,
        port,
        password,
        db: database
      });

      return redis;
    });

    client.on('error', RedisLockStore.onUnexpectedError);

    return new RedisLockStore({ client, listNames });
  }

  public async acquireLock ({ value, expiresAt = Number.MAX_SAFE_INTEGER }: {
    value: string;
    expiresAt?: number;
  }): Promise<void> {
    if (expiresAt < Date.now()) {
      throw new errors.ExpirationInPast('A lock must not expire in the past.');
    }

    const key = this.getKey({ value });
    const expiration = RedisLockStore.getExpiration({ expiresAt });

    const result = await this.client.set(key, '', 'PX', expiration, 'NX');

    if (!result) {
      throw new errors.LockAcquireFailed('Failed to acquire lock.');
    }
  }

  public async isLocked ({ value }: {
    value: string;
  }): Promise<boolean> {
    const key = this.getKey({ value });
    const count = await this.client.exists(key);

    return count === 1;
  }

  public async renewLock ({ value, expiresAt }: {
    value: string;
    expiresAt: number;
  }): Promise<void> {
    if (expiresAt < Date.now()) {
      throw new errors.ExpirationInPast('A lock must not expire in the past.');
    }

    const key = this.getKey({ value });
    const expiration = RedisLockStore.getExpiration({ expiresAt });

    const result = await this.client.pexpire(key, expiration);

    if (!result) {
      throw new errors.LockRenewalFailed('Failed to renew lock.');
    }
  }

  public async releaseLock ({ value }: {
    value: string;
  }): Promise<void> {
    const key = this.getKey({ value });

    await this.client.del(key);
  }

  // eslint-disable-next-line class-methods-use-this
  public async setup (): Promise<void> {
    // There is nothing to do here.
  }

  public async destroy (): Promise<void> {
    this.client.removeListener('error', RedisLockStore.onUnexpectedError);

    await new Promise<void>((resolve, reject): void => {
      this.client.quit((err): void => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });
  }
}

export { RedisLockStore };
