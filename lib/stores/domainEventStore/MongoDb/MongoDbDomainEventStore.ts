import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { CollectionNames } from './CollectionNames';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { parse } from 'url';
import { PassThrough } from 'stream';
import retry from 'async-retry';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { Collection, Db, MongoClient } from 'mongodb';

class MongoDbDomainEventStore implements DomainEventStore {
  protected client: MongoClient;

  protected db: Db;

  protected collectionNames: CollectionNames;

  protected collections: {
    domainEvents: Collection<any>;
    snapshots: Collection<any>;
    counters: Collection<any>;
  };

  protected constructor ({ client, db, collectionNames, collections }: {
    client: MongoClient;
    db: Db;
    collectionNames: CollectionNames;
    collections: {
      domainEvents: Collection<any>;
      snapshots: Collection<any>;
      counters: Collection<any>;
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

  public static async create ({ hostname, port, username, password, database, collectionNames }: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    collectionNames: CollectionNames;
  }): Promise<MongoDbDomainEventStore> {
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

    db.on('close', MongoDbDomainEventStore.onUnexpectedClose);

    const collections = {
      domainEvents: db.collection(collectionNames.domainEvents),
      snapshots: db.collection(collectionNames.snapshots),
      counters: db.collection(collectionNames.counters)
    };

    const domainEventStore = new MongoDbDomainEventStore({
      client,
      db,
      collectionNames,
      collections
    });

    await collections.domainEvents.createIndexes([
      {
        key: { 'aggregateIdentifier.id': 1 },
        name: `${collectionNames.domainEvents}_aggregateId`
      },
      {
        key: { 'aggregateIdentifier.id': 1, 'metadata.revision.aggregate': 1 },
        name: `${collectionNames.domainEvents}_aggregateId_revisionAggregate`,
        unique: true
      },
      {
        key: { 'metadata.revision.global': 1 },
        name: `${collectionNames.domainEvents}_revisionGlobal`,
        unique: true
      }
    ]);
    await collections.snapshots.createIndexes([
      {
        key: { 'aggregateIdentifier.id': 1 },
        unique: true
      }
    ]);

    try {
      await collections.counters.insertOne({
        _id: collectionNames.domainEvents,
        seq: 0
      });
    } catch (ex) {
      if (ex.code === 11000 && ex.message.includes('_counters index: _id_ dup key')) {
        return domainEventStore;
      }

      throw ex;
    }

    return domainEventStore;
  }

  protected async getNextSequence ({ name }: {
    name: string;
  }): Promise<number> {
    const counter = await this.collections.counters.findOneAndUpdate(
      { _id: name },
      { $inc: { seq: 1 }},
      { returnOriginal: false }
    );

    return counter.value.seq;
  }

  public async getLastDomainEvent ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<DomainEventData> | undefined> {
    const domainEvents = await this.collections.domainEvents.find({
      'aggregateIdentifier.id': aggregateIdentifier.id
    }, {
      projection: { _id: 0 },
      sort: { 'metadata.revision.aggregate': -1 },
      limit: 1
    }).toArray();

    if (domainEvents.length === 0) {
      return;
    }

    return new DomainEvent<DomainEventData>(domainEvents[0]);
  }

  public async getDomainEventStream ({
    aggregateIdentifier,
    fromRevision = 1,
    toRevision = (2 ** 31) - 1
  }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision?: number;
    toRevision?: number;
  }): Promise<PassThrough> {
    if (fromRevision > toRevision) {
      throw new Error('From revision is greater than to revision.');
    }

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = this.collections.domainEvents.find({
      $and: [
        { 'aggregateIdentifier.id': aggregateIdentifier.id },
        { 'metadata.revision.aggregate': { $gte: fromRevision }},
        { 'metadata.revision.aggregate': { $lte: toRevision }}
      ]
    }, {
      projection: { _id: 0 },
      sort: { 'metadata.revision.aggregate': 1 }
    }).stream();

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      domainEventStream.removeListener('data', onData);
      domainEventStream.removeListener('end', onEnd);
      domainEventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      passThrough.write(new DomainEvent<DomainEventData>(data));
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();

      // In the PostgreSQL eventstore, we call domainEventStream.end() here. In
      // MongoDB, this function apparently is not implemented. This note is just
      // for informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();

      // In the PostgreSQL eventstore, we call domainEventStream.end() here. In
      // MongoDB, this function apparently is not implemented. This note is just
      // for informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    domainEventStream.on('data', onData);
    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);

    return passThrough;
  }

  public async getUnpublishedDomainEventStream (): Promise<PassThrough> {
    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = this.collections.domainEvents.find({
      'metadata.isPublished': false
    }, {
      projection: { _id: 0 },
      sort: { 'metadata.revision.global': 1 }
    }).stream();

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      domainEventStream.removeListener('data', onData);
      domainEventStream.removeListener('end', onEnd);
      domainEventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      passThrough.write(new DomainEvent(data));
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();

      // In the PostgreSQL eventstore, we call domainEventStream.end() here. In
      // MongoDB, this function apparently is not implemented. This note is just
      // for informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();

      // In the PostgreSQL eventstore, we call domainEventStream.end() here. In
      // MongoDB, this function apparently is not implemented. This note is just
      // for informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    domainEventStream.on('data', onData);
    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);

    return passThrough;
  }

  public async saveDomainEvents ({ domainEvents }: {
    domainEvents: DomainEvent<DomainEventData>[];
  }): Promise<DomainEvent<DomainEventData>[]> {
    if (domainEvents.length === 0) {
      throw new Error('Domain events are missing.');
    }

    const savedDomainEvents = [];

    try {
      for (const domainEvent of domainEvents) {
        const revisionGlobal = await this.getNextSequence({
          name: this.collectionNames.domainEvents
        });

        const savedDomainEvent = domainEvent.withRevisionGlobal({ revisionGlobal });

        savedDomainEvents.push(savedDomainEvent);

        await this.collections.domainEvents.insertOne(savedDomainEvent);
      }
    } catch (ex) {
      if (ex.code === 11000 && ex.message.includes('_aggregateId_revision')) {
        throw new Error('Aggregate id and revision already exist.');
      }

      throw ex;
    }

    return savedDomainEvents;
  }

  public async markDomainEventsAsPublished ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision: number;
    toRevision: number;
  }): Promise<void> {
    if (fromRevision > toRevision) {
      throw new Error('From revision is greater than to revision.');
    }

    await this.collections.domainEvents.updateMany({
      'aggregateIdentifier.id': aggregateIdentifier.id,
      'metadata.revision.aggregate': {
        $gte: fromRevision,
        $lte: toRevision
      }
    }, {
      $set: {
        'metadata.isPublished': true
      }
    });
  }

  public async getSnapshot ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<State> | undefined> {
    const snapshot = await this.collections.snapshots.findOne(
      { aggregateIdentifier },
      { projection: { _id: false, revisionAggregate: true, state: true }}
    );

    if (!snapshot) {
      return;
    }

    const mappedSnapshot = {
      aggregateIdentifier,
      revision: snapshot.revisionAggregate,
      state: snapshot.state
    };

    return mappedSnapshot;
  }

  public async saveSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    await this.collections.snapshots.updateOne(
      { aggregateIdentifier: snapshot.aggregateIdentifier },
      { $set: snapshot },
      { upsert: true }
    );
  }

  public async getReplay ({
    fromRevisionGlobal = 1,
    toRevisionGlobal = (2 ** 31) - 1
  }: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
  } = {}): Promise<PassThrough> {
    if (fromRevisionGlobal > toRevisionGlobal) {
      throw new Error('From revision global is greater than to revision global.');
    }

    const passThrough = new PassThrough({ objectMode: true });
    const replayStream = this.collections.domainEvents.find({
      $and: [
        { 'metadata.revision.global': { $gte: fromRevisionGlobal }},
        { 'metadata.revision.global': { $lte: toRevisionGlobal }}
      ]
    }, {
      projection: { _id: 0 },
      sort: { 'metadata.revision.global': 1 }
    }).stream();

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      replayStream.removeListener('data', onData);
      replayStream.removeListener('end', onEnd);
      replayStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      passThrough.write(new DomainEvent<DomainEventData>(data));
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();

      // In the PostgreSQL eventstore, we call replayStream.end() here. In
      // MongoDB, this function apparently is not implemented. This note is just
      // for informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();

      // In the PostgreSQL eventstore, we call replayStream.end() here. In
      // MongoDB, this function apparently is not implemented. This note is just
      // for informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    replayStream.on('data', onData);
    replayStream.on('end', onEnd);
    replayStream.on('error', onError);

    return passThrough;
  }

  public async destroy (): Promise<void> {
    this.db.removeListener('close', MongoDbDomainEventStore.onUnexpectedClose);
    await this.client.close(true);
  }
}

export { MongoDbDomainEventStore };
