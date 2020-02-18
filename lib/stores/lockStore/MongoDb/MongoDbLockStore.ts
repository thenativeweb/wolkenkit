import { CollectionNames } from './CollectionNames';
import { errors } from '../errors';
import { LockStore } from '../LockStore';
import { javascript as maxDate } from '../../../common/utils/maxDate';
import { parse } from 'url';
import { retry } from 'retry-ignore-abort';
import { Collection, Db, MongoClient } from 'mongodb';

class MongoDbLockStore implements LockStore {
  protected client: MongoClient;

  protected db: Db;

  protected nonce: string | null;

  protected maxLockSize: number;

  protected collectionNames: CollectionNames;

  protected collections: {
    locks: Collection<any>;
  };

  protected constructor ({ client, db, nonce, maxLockSize, collectionNames, collections }: {
    client: MongoClient;
    db: Db;
    nonce: string | null;
    maxLockSize: number;
    collectionNames: CollectionNames;
    collections: {
      locks: Collection<any>;
    };
  }) {
    this.client = client;
    this.db = db;
    this.nonce = nonce;
    this.maxLockSize = maxLockSize;
    this.collectionNames = collectionNames;
    this.collections = collections;
  }

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  public static async create ({
    hostName,
    port,
    userName,
    password,
    database,
    collectionNames,
    nonce = null,
    maxLockSize = 968
  }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    collectionNames: CollectionNames;
    nonce?: string | null;
    maxLockSize?: number;
  }): Promise<MongoDbLockStore> {
    const url = `mongodb://${userName}:${password}@${hostName}:${port}/${database}`;

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
      locks: db.collection(collectionNames.locks)
    };

    await collections.locks.createIndexes([
      {
        key: { name: 1 },
        name: `${collectionNames.locks}_name`,
        unique: true
      }
    ]);

    return new MongoDbLockStore({
      client,
      db,
      nonce,
      maxLockSize,
      collectionNames,
      collections
    });
  }

  public async acquireLock ({
    name,
    expiresAt = maxDate
  }: {
    name: any;
    expiresAt?: number;
  }): Promise<void> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    if (expiresAt - Date.now() < 0) {
      throw new errors.ExpirationInPast('Cannot acquire a lock in the past.');
    }

    const query = {
      name
    };
    const entry = await this.collections.locks.findOne(query);

    if (entry) {
      const isLocked = Date.now() < entry.expiresAt;

      if (isLocked) {
        throw new errors.AcquireLockFailed('Failed to acquire lock.');
      }
    }

    const $set = {
      ...query,
      nonce: this.nonce,
      expiresAt
    };

    await this.collections.locks.updateOne(query, { $set }, { upsert: true });
  }

  public async isLocked ({ name }: {
    name: any;
  }): Promise<boolean> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    const entry = await this.collections.locks.findOne({ name });

    const isLocked = Boolean(entry) && Date.now() < entry.expiresAt;

    return isLocked;
  }

  public async renewLock ({ name, expiresAt }: {
    name: any;
    expiresAt: number;
  }): Promise<void> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    if (expiresAt - Date.now() < 0) {
      throw new errors.ExpirationInPast('Cannot acquire a lock in the past.');
    }

    const query = {
      name
    };
    const entry = await this.collections.locks.findOne(query, {
      projection: {
        _id: 0,
        expiresAt: 1,
        nonce: 1
      }
    });

    if (!entry) {
      throw new errors.RenewLockFailed('Failed to renew lock.');
    }
    if (entry.expiresAt < Date.now() || this.nonce !== entry.nonce) {
      throw new errors.RenewLockFailed('Failed to renew lock.');
    }

    await this.collections.locks.updateOne(query, { $set: { expiresAt }});
  }

  public async releaseLock ({ name }: {
    name: any;
  }): Promise<void> {
    if (name.length > this.maxLockSize) {
      throw new errors.LockNameTooLong('Lock name is too long.');
    }

    const entry = await this.collections.locks.findOne({ name }, {
      projection: {
        _id: 0,
        expiresAt: 1,
        nonce: 1
      }
    });

    if (!entry) {
      return;
    }
    if (Date.now() < entry.expiresAt && this.nonce !== entry.nonce) {
      throw new errors.ReleaseLockFailed('Failed to release lock.');
    }

    await this.collections.locks.deleteOne({ name });
  }

  public async destroy (): Promise<void> {
    this.db.removeListener('close', MongoDbLockStore.onUnexpectedClose);
    await this.client.close(true);
  }
}

export { MongoDbLockStore };
