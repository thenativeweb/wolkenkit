import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { CollectionNames } from './CollectionNames';
import { ConsumerProgressStore } from '../ConsumerProgressStore';
import { errors } from '../../../common/errors';
import { parse } from 'url';
import { retry } from 'retry-ignore-abort';
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
    hostName,
    port,
    userName,
    password,
    database,
    collectionNames
  }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    collectionNames: CollectionNames;
  }): Promise<MongoDbConsumerProgressStore> {
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

    db.on('close', MongoDbConsumerProgressStore.onUnexpectedClose);

    const collections = {
      progress: db.collection(collectionNames.progress)
    };

    await collections.progress.createIndexes([{
      key: { consumerId: 1, aggregateId: 1 },
      name: `${collectionNames.progress}_consumerId_aggregateId`,
      unique: true
    }]);

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
  }): Promise<number> {
    const result = await this.collections.progress.findOne({
      consumerId,
      aggregateId: aggregateIdentifier.id
    });

    if (!result) {
      return 0;
    }

    return result.revision;
  }

  public async setProgress ({ consumerId, aggregateIdentifier, revision }: {
    consumerId: string;
    aggregateIdentifier: AggregateIdentifier;
    revision: number;
  }): Promise<void> {
    await withTransaction({
      client: this.client,
      fn: async ({ session }): Promise<void> => {
        const { modifiedCount } = await this.collections.progress.updateOne(
          {
            consumerId,
            aggregateId: aggregateIdentifier.id,
            revision: { $lt: revision }
          },
          { $set: { revision }},
          { session }
        );

        if (modifiedCount === 1) {
          return;
        }

        try {
          await this.collections.progress.insertOne(
            { consumerId, aggregateId: aggregateIdentifier.id, revision },
            { session }
          );
        } catch {
          throw new errors.RevisionTooLow();
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

  public async destroy (): Promise<void> {
    this.db.removeListener('close', MongoDbConsumerProgressStore.onUnexpectedClose);
    await this.client.close(true);
  }
}

export { MongoDbConsumerProgressStore };
