import { ListNames } from './ListNames';
import { LockStore } from '../LockStore';
import { javascript as maxDate } from '../../../common/utils/maxDate';
import { noop } from 'lodash';
import retry from 'async-retry';
import { sortKeys } from '../../../common/utils/sortKeys';
import redis, { RedisClient } from 'redis';

class RedisLockStore implements LockStore {
  protected client: RedisClient;

  protected listNames: ListNames;

  protected maxLockSize: number;

  protected nonce: string;

  protected requireValidExpiration: boolean;

  protected constructor ({
    client,
    listNames,
    maxLockSize,
    nonce,
    requireValidExpiration
  }: {
    client: RedisClient;
    listNames: ListNames;
    maxLockSize: number;
    nonce: string | null;
    requireValidExpiration: boolean;
  }) {
    this.client = client;
    this.listNames = listNames;
    this.maxLockSize = maxLockSize;
    this.nonce = nonce ?? 'null';
    this.requireValidExpiration = requireValidExpiration;
  }

  protected getLockName ({ namespace, value, list }: {
    namespace: string;
    value: any;
    list: string;
  }): string {
    const sortedSerializedValue = JSON.stringify(sortKeys({
      object: value,
      recursive: true
    }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const name = `${list}#${namespace}#${sortedSerializedValue}`;

    return name;
  }

  protected static getExpiration ({ expiresAt }: {
    expiresAt: number;
  }): number {
    const expiration = expiresAt - Date.now();

    return expiration;
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
    requireValidExpiration = true,
    maxLockSize = 2048
  }: {
    hostName: string;
    port: number;
    password: string;
    database: string;
    listNames: ListNames;
    nonce?: string | null;
    requireValidExpiration?: boolean;
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

    const lockstore = new RedisLockStore({
      client,
      listNames,
      maxLockSize,
      nonce,
      requireValidExpiration
    });

    return lockstore;
  }

  public async acquireLock ({
    namespace,
    value,
    expiresAt = maxDate,
    onAcquired = noop
  }: {
    namespace: string;
    value: any;
    expiresAt?: number;
    onAcquired? (): void | Promise<void>;
  }): Promise<void> {
    const key = this.getLockName({ namespace, value, list: this.listNames.locks });
    const expiration = RedisLockStore.getExpiration({ expiresAt });

    let result;

    if (expiration < 0) {
      if (this.requireValidExpiration) {
        throw new Error('Redis cannot acquire a lock in the past.');
      }

      result = 'OK';
    } else {
      result = await new Promise((resolve, reject): void => {
        this.client.set(key, this.nonce, 'PX', expiration, 'NX', (err, reply): void => {
          if (err) {
            return reject(err);
          }

          resolve(reply);
        });
      });
    }

    if (!result) {
      throw new Error('Failed to acquire lock.');
    }

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
    const key = this.getLockName({ namespace, value, list: this.listNames.locks });

    const existingLock = await new Promise((resolve, reject): void => {
      this.client.get(key, (err, reply): void => {
        if (err) {
          return reject(err);
        }

        resolve(reply);
      });
    });

    const isLocked = Boolean(existingLock);

    return isLocked;
  }

  public async renewLock ({ namespace, value, expiresAt }: {
    namespace: string;
    value: any;
    expiresAt: number;
  }): Promise<void> {
    const key = this.getLockName({ namespace, value, list: this.listNames.locks });
    const expiration = RedisLockStore.getExpiration({ expiresAt });

    let result;

    if (expiration < 0) {
      if (this.requireValidExpiration) {
        throw new Error('Redis cannot renew a lock in the past.');
      }

      result = 'OK';
    } else {
      const existingLock = await new Promise((resolve, reject): void => {
        this.client.get(key, (err, reply): void => {
          if (err) {
            return reject(err);
          }

          resolve(reply);
        });
      });

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
    }

    if (!result) {
      throw new Error('Failed to renew lock.');
    }
  }

  public async releaseLock ({ namespace, value }: {
    namespace: string;
    value: any;
  }): Promise<void> {
    const key = this.getLockName({ namespace, value, list: this.listNames.locks });

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
      throw new Error('Failed to release lock.');
    }
  }

  public async destroy (): Promise<void> {
    this.client.removeListener('error', RedisLockStore.onUnexpectedError);
    this.client.quit();
  }
}

export { RedisLockStore };
