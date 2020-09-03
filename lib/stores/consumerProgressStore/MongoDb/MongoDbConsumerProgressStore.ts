import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { CollectionNames } from './CollectionNames';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { errors } from '../../../common/errors';
import { IsReplaying } from '../IsReplaying';
import { MongoDbConsumerProgressStoreOptions } from './MongoDbConsumerProgressStoreOptions';
import { retry } from 'retry-ignore-abort';
import { URL } from 'url';
import { withTransaction } from '../../utils/mongoDb/withTransaction';
import { Collection, Db, MongoClient } from 'mongodb';

class MongoDbConsumerProgressStore implements ConsumerProgressStore {
  protected client: MongoClient;

  protected db: Db;

  protected collectionNames: CollectionNames;

  protected collections: {
    progress: Collection<any>;
  };

  protected constructor ({ client, db, collectionNames, collections }: {
    client: MongoClient;
    db: Db;
    collectionNames: CollectionNames;
    collections: {
      progress: Collection<any>;
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
    connectionString,
    collectionNames
  }: MongoDbConsumerProgressStoreOptions): Promise<MongoDbConsumerProgressStore> {
    const client = await retry(async (): Promise<MongoClient> => {
      const connection = await MongoClient.connect(
        connectionString,
        // eslint-disable-next-line id-length
        { w: 1, useNewUrlParser: true, useUnifiedTopology: true }
      );

      return connection;
    });

    const { pathname } = new URL(connectionString);

    const databaseName = pathname.slice(1);
    const db = client.db(databaseName);

    db.on('close', MongoDbConsumerProgressStore.onUnexpectedClose);

    const collections = {
      progress: db.collection(collectionNames.progress)
    };

    return new MongoDbConsumerProgressStore({
      client,
      db,
      collectionNames,
      collections
    });
  }

  public async getProgress ({ consumerId, aggregateIdentifier }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<{ revision: number; isReplaying: IsReplaying }> {
    const result = await this.collections.progress.findOne({
      consumerId,
      aggregateId: aggregateIdentifier.id
    });

    if (!result) {
      return { revision: 0, isReplaying: false };
    }

    return { revision: result.revision, isReplaying: result.isReplaying };
  }

  public async setProgress ({ consumerId, aggregateIdentifier, revision }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    revision: number;
  }): Promise<void> {
    await withTransaction({
      client: this.client,
      fn: async ({ session }): Promise<void> => {
        const { matchedCount } = await this.collections.progress.updateOne(
          {
            consumerId,
            aggregateId: aggregateIdentifier.id,
            revision: { $lt: revision }
          },
          { $set: { revision }},
          { session }
        );

        if (matchedCount === 1) {
          return;
        }

        try {
          await this.collections.progress.insertOne(
            { consumerId, aggregateId: aggregateIdentifier.id, revision, isReplaying: false },
            { session }
          );
        } catch {
          throw new errors.RevisionTooLow();
        }
      }
    });
  }

  public async setIsReplaying ({ consumerId, aggregateIdentifier, isReplaying }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    isReplaying: IsReplaying;
  }): Promise<void> {
    await withTransaction({
      client: this.client,
      fn: async ({ session }): Promise<void> => {
        const { matchedCount } = await this.collections.progress.updateOne(
          {
            consumerId,
            aggregateId: aggregateIdentifier.id,
            isReplaying: { $eq: false }
          },
          { $set: { isReplaying }},
          { session }
        );

        if (matchedCount === 1) {
          return;
        }

        try {
          await this.collections.progress.insertOne(
            { consumerId, aggregateId: aggregateIdentifier.id, revision: 0, isReplaying },
            { session }
          );
        } catch {
          throw new errors.FlowIsAlreadyReplaying();
        }
      }
    });
  }

  public async resetProgress ({ consumerId }: {
    consumerId: string;
  }): Promise<void> {
    await withTransaction({
      client: this.client,
      fn: async ({ session }): Promise<void> => {
        await this.collections.progress.deleteMany(
          { consumerId },
          { session }
        );
      }
    });
  }

  public async setup (): Promise<void> {
    await this.collections.progress.createIndexes([{
      key: { consumerId: 1, aggregateId: 1 },
      name: `${this.collectionNames.progress}_consumerId_aggregateId`,
      unique: true
    }]);
  }

  public async destroy (): Promise<void> {
    this.db.removeListener('close', MongoDbConsumerProgressStore.onUnexpectedClose);
    await this.client.close(true);
  }
}

export { MongoDbConsumerProgressStore };
