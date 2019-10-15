import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import EventExternal from '../../../common/elements/EventExternal';
import EventInternal from '../../../common/elements/EventInternal';
import { Eventstore } from '../Eventstore';
import limitAlphanumeric from '../../../common/utils/limitAlphanumeric';
import omitByDeep from '../../../common/utils/omitByDeep';
import { parse } from 'url';
import { PassThrough } from 'stream';
import retry from 'async-retry';
import { Snapshot } from '../Snapshot';
import { Collection, Db, MongoClient } from 'mongodb';

class MongoDbEventstore implements Eventstore {
  protected client: MongoClient;

  protected db: Db;

  protected collections: {
    events: Collection<any>;
    snapshots: Collection<any>;
    counters: Collection<any>;
  };

  protected constructor ({ client, db, collections }: {
    client: MongoClient;
    db: Db;
    collections: {
      events: Collection<any>;
      snapshots: Collection<any>;
      counters: Collection<any>;
    };
  }) {
    this.client = client;
    this.db = db;
    this.collections = collections;
  }

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  public static async create ({ hostname, port, username, password, database, namespace }: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    namespace: string;
  }): Promise<MongoDbEventstore> {
    const prefixedNamespace = `store_${limitAlphanumeric(namespace)}`;

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

    db.on('close', MongoDbEventstore.onUnexpectedClose);

    const collections = {
      events: db.collection(`${prefixedNamespace}_events`),
      snapshots: db.collection(`${prefixedNamespace}_snapshots`),
      counters: db.collection(`${prefixedNamespace}_counters`)
    };

    const eventstore = new MongoDbEventstore({ client, db, collections });

    await collections.events.createIndexes([
      {
        key: { 'aggregateIdentifier.id': 1 },
        name: `${prefixedNamespace}_aggregateId`
      },
      {
        key: { 'aggregateIdentifier.id': 1, 'metadata.revision.aggregate': 1 },
        name: `${prefixedNamespace}_aggregateId_revisionAggregate`,
        unique: true
      },
      {
        key: { 'metadata.revision.global': 1 },
        name: `${prefixedNamespace}_revisionGlobal`,
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
      await collections.counters.insertOne({ _id: 'events', seq: 0 });
    } catch (ex) {
      if (ex.code === 11000 && ex.message.includes('_counters index: _id_ dup key')) {
        return eventstore;
      }

      throw ex;
    }

    return eventstore;
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

  public async getLastEvent ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<EventExternal | undefined> {
    const events = await this.collections.events.find({
      'aggregateIdentifier.id': aggregateIdentifier.id
    }, {
      projection: { _id: 0 },
      sort: { 'metadata.revision.aggregate': -1 },
      limit: 1
    }).toArray();

    if (events.length === 0) {
      return;
    }

    return EventExternal.deserialize(events[0]);
  }

  public async getEventStream ({
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
    const eventStream = this.collections.events.find({
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
      eventStream.removeListener('data', onData);
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      passThrough.write(EventExternal.deserialize(data));
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();

      // In the PostgreSQL eventstore, we call eventStream.end() here. In
      // MongoDB, this function apparently is not implemented. This note is just
      // for informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();

      // In the PostgreSQL eventstore, we call eventStream.end() here. In
      // MongoDB, this function apparently is not implemented. This note is just
      // for informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    eventStream.on('data', onData);
    eventStream.on('end', onEnd);
    eventStream.on('error', onError);

    return passThrough;
  }

  public async getUnpublishedEventStream (): Promise<PassThrough> {
    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = this.collections.events.find({
      'metadata.isPublished': false
    }, {
      projection: { _id: 0 },
      sort: { 'metadata.revision.global': 1 }
    }).stream();

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      eventStream.removeListener('data', onData);
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      passThrough.write(EventExternal.deserialize(data));
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();

      // In the PostgreSQL eventstore, we call eventStream.end() here. In
      // MongoDB, this function apparently is not implemented. This note is just
      // for informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();

      // In the PostgreSQL eventstore, we call eventStream.end() here. In
      // MongoDB, this function apparently is not implemented. This note is just
      // for informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    eventStream.on('data', onData);
    eventStream.on('end', onEnd);
    eventStream.on('error', onError);

    return passThrough;
  }

  public async saveEvents ({ uncommittedEvents }: {
    uncommittedEvents: EventInternal[];
  }): Promise<EventInternal[]> {
    if (uncommittedEvents.length === 0) {
      throw new Error('Uncommitted events are missing.');
    }

    const committedEvents = [];

    try {
      for (const uncommittedEvent of uncommittedEvents) {
        if (!(uncommittedEvent instanceof EventInternal)) {
          throw new Error('Event must be internal.');
        }

        const revisionGlobal = await this.getNextSequence({ name: 'events' });

        let committedEvent = uncommittedEvent.setData({
          data: omitByDeep(
            uncommittedEvent.data,
            (value): boolean => value === undefined
          )
        });

        committedEvent = committedEvent.setRevisionGlobal({ revisionGlobal });
        committedEvents.push(committedEvent);

        // Use cloned events here to hinder MongoDB from adding an _id property
        // to the original event objects.
        await this.collections.events.insertOne(committedEvent.asExternal());
      }
    } catch (ex) {
      if (ex.code === 11000 && ex.message.includes('_aggregateId_revision')) {
        throw new Error('Aggregate id and revision already exist.');
      }

      throw ex;
    }

    const indexForSnapshot = committedEvents.findIndex(
      (committedEvent): boolean =>
        committedEvent.metadata.revision.aggregate % 100 === 0
    );

    if (indexForSnapshot !== -1) {
      const { aggregateIdentifier } = committedEvents[indexForSnapshot];
      const { aggregate: revisionAggregate } = committedEvents[indexForSnapshot].metadata.revision;
      const { state } = committedEvents[indexForSnapshot].annotations;

      await this.saveSnapshot({
        snapshot: { aggregateIdentifier, revision: revisionAggregate, state }
      });
    }

    return committedEvents;
  }

  public async markEventsAsPublished ({ aggregateIdentifier, fromRevision, toRevision }: {
    aggregateIdentifier: AggregateIdentifier;
    fromRevision: number;
    toRevision: number;
  }): Promise<void> {
    if (fromRevision > toRevision) {
      throw new Error('From revision is greater than to revision.');
    }

    await this.collections.events.updateMany({
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
  }): Promise<Snapshot | undefined> {
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
    snapshot: Snapshot;
  }): Promise<void> {
    const filteredState = omitByDeep(
      snapshot.state,
      (value): boolean => value === undefined
    );

    await this.collections.snapshots.updateOne(
      { aggregateIdentifier: snapshot.aggregateIdentifier },
      { $set: {
        aggregateIdentifier: snapshot.aggregateIdentifier,
        state: filteredState,
        revisionAggregate: snapshot.revision
      }},
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
    const replayStream = this.collections.events.find({
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
      passThrough.write(EventExternal.deserialize(data));
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
    this.db.removeListener('close', MongoDbEventstore.onUnexpectedClose);
    await this.client.close(true);
  }
}

export default MongoDbEventstore;
