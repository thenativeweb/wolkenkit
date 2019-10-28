import { LockStore } from '../LockStore';
import { javascript as maxDate } from '../../../common/utils/maxDate';
import { noop } from 'lodash';
import { parse } from 'url';
import retry from 'async-retry';
import { sortKeys } from '../../../common/utils/sortKeys';
import { Collection, Db, MongoClient } from 'mongodb';

class MongoDbLockStore implements LockStore {
  protected client: MongoClient;

  protected db: Db;

  protected nonce: string | null;

  protected maxLockSize: number;

  protected collections: {
    locks: Collection<any>;
  };

  protected constructor ({ client, db, nonce, maxLockSize, collections }: {
    client: MongoClient;
    db: Db;
    nonce: string | null;
    maxLockSize: number;
    collections: {
      locks: Collection<any>;
    };
  }) {
    this.client = client;
    this.db = db;
    this.nonce = nonce;
    this.maxLockSize = maxLockSize;
    this.collections = collections;
  }

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  public static async create ({
    hostname,
    port,
    username,
    password,
    database,
    namespace,
    nonce = null,
    maxLockSize = 968
  }: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    namespace: string;
    nonce: string | null;
    maxLockSize: number;
  }): Promise<MongoDbLockStore> {
    const prefixedNamespace = `lockstore_${limitAlphanumeric(namespace)}`;

    const url = `mongodb://${username}:${password}@${hostname}:${port}/${database}`;

    /* eslint-disable id-length */
    const client = await retry(async (): Promise<MongoClient> => {
      const connection = await MongoClient.connect(
        url,
        {
          w: 1,
          useNewUrlParser: true,
          useUnifiedTopology: true
        }
      );

      return connection;
    });
    /* eslint-enable id-length */

    const { pathname } = parse(url);

    if (!pathname) {
      throw new Error('Pathname is missing.');
    }

    const databaseName = pathname.slice(1);
    const db = client.db(databaseName);

    db.on('close', MongoDbLockStore.onUnexpectedClose);

    const collections = {
      locks: db.collection(`${prefixedNamespace}_locks`)
    };

    const lockstore = new MongoDbLockStore({
      client,
      db,
      nonce,
      maxLockSize,
      collections
    });

    await collections.locks.createIndexes([
      {
        key: { namespace: 1, value: 1 },
        name: `${prefixedNamespace}_namespace_value`,
        unique: true
      }
    ]);

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
    expiresAt: number;
    onAcquired (): void | Promise<void>;
  }): Promise<void> {
    const sortedSerializedValue = JSON.stringify(sortKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const query = {
      namespace,
      value: sortedSerializedValue
    };
    const entry = await this.collections.locks.findOne(query);

    if (entry) {
      const isLocked = Date.now() < entry.expiresAt.getTime();

      if (isLocked) {
        throw new Error('Failed to acquire lock.');
      }
    }

    const $set = {
      ...query,
      nonce: this.nonce,
      expiresAt: new Date(expiresAt)
    };

    await this.collections.locks.updateOne(query, { $set }, { upsert: true });

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
    const sortedSerializedValue = JSON.stringify(sortKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const query = {
      namespace,
      value: sortedSerializedValue
    };
    const entry = await this.collections.locks.findOne(query);

    const isLocked = Boolean(entry) && Date.now() < entry.expiresAt.getTime();

    return isLocked;
  }

  public async renewLock ({ namespace, value, expiresAt }: {
    namespace: string;
    value: any;
    expiresAt: number;
  }): Promise<void> {
    const sortedSerializedValue = JSON.stringify(sortKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const query = {
      namespace,
      value: sortedSerializedValue
    };
    const entry = await this.collections.locks.findOne(query, {
      projection: {
        _id: 0,
        expiresAt: 1,
        nonce: 1
      }
    });

    if (!entry) {
      throw new Error('Failed to renew lock.');
    }
    if (entry.expiresAt.getTime() < Date.now() || this.nonce !== entry.nonce) {
      throw new Error('Failed to renew lock.');
    }

    await this.collections.locks.updateOne(query, { $set: { expiresAt: new Date(expiresAt) }});
  }

  public async releaseLock ({ namespace, value }: {
    namespace: string;
    value: any;
  }): Promise<void> {
    const sortedSerializedValue = JSON.stringify(sortKeys({ object: value, recursive: true }));

    if (sortedSerializedValue.length > this.maxLockSize) {
      throw new Error('Lock value is too large.');
    }

    const queryGet = {
      namespace,
      value: sortedSerializedValue
    };
    const entry = await this.collections.locks.findOne(queryGet, {
      projection: {
        _id: 0,
        expiresAt: 1,
        nonce: 1
      }
    });

    if (!entry) {
      return;
    }
    if (Date.now() < entry.expiresAt.getTime() && this.nonce !== entry.nonce) {
      throw new Error('Failed to release lock.');
    }

    const queryRemove = {
      namespace,
      value: sortedSerializedValue
    };

    await this.collections.locks.deleteOne(queryRemove);
  }

  public async destroy (): Promise<void> {
    this.db.removeListener('close', MongoDbLockStore.onUnexpectedClose);
    await this.client.close(true);
  }
}

export { MongoDbLockStore };
