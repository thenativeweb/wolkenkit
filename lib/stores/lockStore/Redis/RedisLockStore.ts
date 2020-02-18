import { errors } from '../errors';
import { ListNames } from './ListNames';
import { LockStore } from '../LockStore';
import { javascript as maxDate } from '../../../common/utils/maxDate';
import { retry } from 'retry-ignore-abort';
import redis, { RedisClient } from 'redis';

class RedisLockStore implements LockStore {
  protected client: RedisClient;

  protected listNames: ListNames;

  protected maxLockSize: number;

  protected nonce: string;

  protected constructor ({
    client,
    listNames,
    maxLockSize,
    nonce
  }: {
    client: RedisClient;
    listNames: ListNames;
    maxLockSize: number;
    nonce: string | null;
  }) {
    this.client = client;
    this.listNames = listNames;
    this.maxLockSize = maxLockSize;
    this.nonce = nonce ?? 'null';
  }

  protected getLockName ({ name, list }: {
    name: any;
    list: string;
  }): string {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    return `${list}#${name}`;
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
    listNames,
    nonce = 'null',
    maxLockSize = 2048
  }: {
    hostName: string;
    port: number;
    password: string;
    database: string;
    listNames: ListNames;
    nonce?: string | null;
    maxLockSize?: number;
  }): Promise<RedisLockStore> {
    const url = `redis://:${password}@${hostName}:${port}/${database}`;

    const client = await retry(async (): Promise<RedisClient> => new Promise((resolve, reject): void => {
      const redisClient = redis.createClient({ url });

      redisClient.ping((err: Error | null): void => {
        if (err) {
          return reject(err);
        }

        resolve(redisClient);
      });
    }));

    client.on('error', RedisLockStore.onUnexpectedError);

    return new RedisLockStore({
      client,
      listNames,
      maxLockSize,
      nonce
    });
  }

  public async acquireLock ({
    name,
    expiresAt = maxDate
  }: {
    name: any;
    expiresAt?: number;
  }): Promise<void> {
    const key = this.getLockName({ name, list: this.listNames.locks });
    const expiration = RedisLockStore.getExpiration({ expiresAt });

    if (expiration < 0) {
      throw new errors.ExpirationInPast('Cannot acquire a lock in the past.');
    }

    const result = await new Promise((resolve, reject): void => {
      this.client.set(key, this.nonce, 'PX', expiration, 'NX', (err, reply): void => {
        if (err) {
          return reject(err);
        }

        resolve(reply);
      });
    });

    if (!result) {
      throw new errors.AcquireLockFailed('Failed to acquire lock.');
    }
  }

  public async isLocked ({ name }: {
    name: any;
  }): Promise<boolean> {
    const key = this.getLockName({ name, list: this.listNames.locks });

    const existingLock = await new Promise((resolve, reject): void => {
      this.client.get(key, (err, reply): void => {
        if (err) {
          return reject(err);
        }

        resolve(reply);
      });
    });

    return Boolean(existingLock);
  }

  public async renewLock ({ name, expiresAt }: {
    name: any;
    expiresAt: number;
  }): Promise<void> {
    const key = this.getLockName({ name, list: this.listNames.locks });
    const expiration = RedisLockStore.getExpiration({ expiresAt });

    if (expiration < 0) {
      throw new errors.ExpirationInPast('Cannot acquire a lock in the past.');
    }

    const existingLock = await new Promise((resolve, reject): void => {
      this.client.get(key, (err, reply): void => {
        if (err) {
          return reject(err);
        }

        resolve(reply);
      });
    });

    let result;

    if (existingLock === this.nonce) {
      result = await new Promise((resolve, reject): void => {
        this.client.pexpire(key, expiration, (err, reply): void => {
          if (err) {
            return reject(err);
          }

          resolve(reply);
        });
      });
    }

    if (!result) {
      throw new errors.RenewLockFailed('Failed to renew lock.');
    }
  }

  public async releaseLock ({ name }: {
    name: any;
  }): Promise<void> {
    const key = this.getLockName({ name, list: this.listNames.locks });

    let result;

    const existingLock = await new Promise((resolve, reject): void => {
      this.client.get(key, (err, reply): void => {
        if (err) {
          return reject(err);
        }

        resolve(reply);
      });
    });

    if (!existingLock) {
      result = 'OK';
    } else if (existingLock === this.nonce) {
      result = await new Promise((resolve, reject): void => {
        this.client.del(key, (err): void => {
          if (err) {
            return reject(err);
          }

          // At some point the entry may already have been removed by Redis.
          resolve('OK');
        });
      });
    }

    if (!result) {
      throw new errors.ReleaseLockFailed('Failed to release lock.');
    }
  }

  public async destroy (): Promise<void> {
    this.client.removeListener('error', RedisLockStore.onUnexpectedError);
    this.client.quit();
  }
}

export { RedisLockStore };
