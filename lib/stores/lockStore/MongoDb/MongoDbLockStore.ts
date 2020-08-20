import { CollectionNames } from './CollectionNames';
import { errors } from '../../../common/errors';
import { getHash } from '../../../common/utils/crypto/getHash';
import { LockStore } from '../LockStore';
import { MongoDbLockStoreOptions } from './MongoDbLockStoreOptions';
import { parse } from 'url';
import { retry } from 'retry-ignore-abort';
import { Collection, Db, MongoClient } from 'mongodb';

class MongoDbLockStore implements LockStore {
  protected client: MongoClient;

  protected db: Db;

  protected collectionNames: CollectionNames;

  protected collections: {
    locks: Collection<any>;
  };

  protected constructor ({ client, db, collectionNames, collections }: {
    client: MongoClient;
    db: Db;
    collectionNames: CollectionNames;
    collections: {
      locks: Collection<any>;
    };
  }) {
    this.client = client;
    this.db = db;
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
    collectionNames
  }: MongoDbLockStoreOptions): Promise<MongoDbLockStore> {
    const url = `mongodb://${userName}:${password}@${hostName}:${port}/${database}`;

    const client = await retry(async (): Promise<MongoClient> => {
      const connection = await MongoClient.connect(
        url,
        // eslint-disable-next-line id-length
        { w: 1, useNewUrlParser: true, useUnifiedTopology: true }
      );

      return connection;
    });

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

    return new MongoDbLockStore({
      client,
      db,
      collectionNames,
      collections
    });
  }

  protected async removeExpiredLocks (): Promise<void> {
    await this.collections.locks.deleteMany({ expiresAt: { $lt: Date.now() }});
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

    try {
      await this.collections.locks.insertOne({ value: hash, expiresAt });
    } catch {
      throw new errors.LockAcquireFailed('Failed to acquire lock.');
    }
  }

  public async isLocked ({ value }: {
    value: string;
  }): Promise<boolean> {
    const hash = getHash({ value });

    const lock = await this.collections.locks.findOne({
      value: hash,
      expiresAt: { $gte: Date.now() }
    });

    if (!lock) {
      return false;
    }

    return true;
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

    const { modifiedCount } = await this.collections.locks.updateOne(
      { value: hash },
      { $set: { expiresAt }}
    );

    if (modifiedCount === 0) {
      throw new errors.LockRenewalFailed('Failed to renew lock.');
    }
  }

  public async releaseLock ({ value }: {
    value: string;
  }): Promise<void> {
    // From time to time, we should removed expired locks. Doing this before
    // releasing existing ones is a good point in time for this.
    await this.removeExpiredLocks();

    const hash = getHash({ value });

    await this.collections.locks.deleteOne({ value: hash });
  }

  public async setup (): Promise<void> {
    await this.collections.locks.createIndexes([{
      key: { value: 1 },
      name: `${this.collectionNames.locks}_value`,
      unique: true
    }]);
  }

  public async destroy (): Promise<void> {
    this.db.removeListener('close', MongoDbLockStore.onUnexpectedClose);
    await this.client.close(true);
  }
}

export { MongoDbLockStore };
