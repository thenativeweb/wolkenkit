import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { CollectionNames } from './CollectionNames';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { errors } from '../../../common/errors';
import { omitDeepBy } from '../../../common/utils/omitDeepBy';
import { parse } from 'url';
import { retry } from 'retry-ignore-abort';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { Collection, Db, MongoClient } from 'mongodb';
import { PassThrough, Readable } from 'stream';

class MongoDbDomainEventStore implements DomainEventStore {
  protected client: MongoClient;

  protected db: Db;

  protected collectionNames: CollectionNames;

  protected collections: {
    domainEvents: Collection<any>;
    snapshots: Collection<any>;
  };

  protected constructor ({ client, db, collectionNames, collections }: {
    client: MongoClient;
    db: Db;
    collectionNames: CollectionNames;
    collections: {
      domainEvents: Collection<any>;
      snapshots: Collection<any>;
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

  public static async create ({ hostName, port, userName, password, database, collectionNames }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    collectionNames: CollectionNames;
  }): Promise<MongoDbDomainEventStore> {
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

    db.on('close', MongoDbDomainEventStore.onUnexpectedClose);

    const collections = {
      domainEvents: db.collection(collectionNames.domainEvents),
      snapshots: db.collection(collectionNames.snapshots)
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
        key: { 'aggregateIdentifier.id': 1, 'metadata.revision': 1 },
        name: `${collectionNames.domainEvents}_aggregateId_revision`,
        unique: true
      },
      {
        key: { 'metadata.causationId': 1 },
        name: `${collectionNames.domainEvents}_causationId`
      },
      {
        key: { 'metadata.correlationId': 1 },
        name: `${collectionNames.domainEvents}_correlationId`
      },
      {
        key: { 'metadata.timestamp': 1 },
        name: `${collectionNames.domainEvents}_timestamp`
      }
    ]);
    await collections.snapshots.createIndexes([
      {
        key: { 'aggregateIdentifier.id': 1 },
        unique: true
      }
    ]);

    return domainEventStore;
  }

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const domainEvents = await this.collections.domainEvents.find({
      'aggregateIdentifier.id': aggregateIdentifier.id
    }, {
      projection: { _id: 0 },
      sort: [[ 'metadata.revision', -1 ]],
      limit: 1
    }).toArray();

    if (domainEvents.length === 0) {
      return;
    }

    return new DomainEvent<TDomainEventData>(domainEvents[0]);
  }

  public async getDomainEventsByCausationId <TDomainEventData extends DomainEventData> ({ causationId }: {
    causationId: string;
  }): Promise<Readable> {
    const domainEventStream = this.collections.domainEvents.find({
      'metadata.causationId': causationId
    }, {
      projection: { _id: 0 }
    }).stream();

    const passThrough = new PassThrough({ objectMode: true });

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      domainEventStream.removeListener('data', onData);
      domainEventStream.removeListener('end', onEnd);
      domainEventStream.removeListener('error', onError);
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();
    };

    onData = function (data: any): void {
      passThrough.write(new DomainEvent<DomainEventData>(data));
    };

    domainEventStream.on('data', onData);
    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);

    return passThrough;
  }

  public async hasDomainEventsWithCausationId ({ causationId }: {
    causationId: string;
  }): Promise<boolean> {
    const domainEventCount = await this.collections.domainEvents.findOne({
      'metadata.causationId': causationId
    });

    return domainEventCount !== null;
  }

  public async getDomainEventsByCorrelationId <TDomainEventData extends DomainEventData> ({ correlationId }: {
    correlationId: string;
  }): Promise<Readable> {
    const domainEventStream = this.collections.domainEvents.find({
      'metadata.correlationId': correlationId
    }, {
      projection: { _id: 0 }
    }).stream();

    const passThrough = new PassThrough({ objectMode: true });

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      domainEventStream.removeListener('data', onData);
      domainEventStream.removeListener('end', onEnd);
      domainEventStream.removeListener('error', onError);
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();
    };

    onData = function (data: any): void {
      passThrough.write(new DomainEvent<DomainEventData>(data));
    };

    domainEventStream.on('data', onData);
    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);

    return passThrough;
  }

  public async getReplay ({
    fromTimestamp = 0
  }: {
    fromTimestamp?: number;
  } = {}): Promise<Readable> {
    if (fromTimestamp < 0) {
      throw new errors.ParameterInvalid(`Parameter 'fromTimestamp' must be at least 0.`);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const replayStream = this.collections.domainEvents.find({
      'metadata.timestamp': { $gte: fromTimestamp }
    }, {
      projection: { _id: 0 },
      sort: [[ 'aggregateId', 1 ], [ 'metadata.revision', 1 ]]
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

  public async getReplayForAggregate ({
    aggregateId,
    fromRevision = 1,
    toRevision = (2 ** 31) - 1
  }: {
    aggregateId: string;
    fromRevision?: number;
    toRevision?: number;
  }): Promise<Readable> {
    if (fromRevision < 1) {
      throw new errors.ParameterInvalid(`Parameter 'fromRevision' must be at least 1.`);
    }
    if (toRevision < 1) {
      throw new errors.ParameterInvalid(`Parameter 'toRevision' must be at least 1.`);
    }
    if (fromRevision > toRevision) {
      throw new errors.ParameterInvalid(`Parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
    }

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = this.collections.domainEvents.find({
      $and: [
        { 'aggregateIdentifier.id': aggregateId },
        { 'metadata.revision': { $gte: fromRevision }},
        { 'metadata.revision': { $lte: toRevision }}
      ]
    }, {
      projection: { _id: 0 },
      sort: [[ 'metadata.revision', 1 ]]
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

  public async storeDomainEvents <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }): Promise<void> {
    if (domainEvents.length === 0) {
      throw new errors.ParameterInvalid('Domain events are missing.');
    }

    const sanitizedDomainEvents = domainEvents.map((domainEvent): DomainEvent<TDomainEventData> => new DomainEvent<TDomainEventData>({
      ...domainEvent,
      data: omitDeepBy(domainEvent.data, (value): boolean => value === undefined)
    }));

    /* eslint-disable id-length */
    const session = this.client.startSession({
      defaultTransactionOptions: {
        readPreference: 'primary',
        readConcern: {
          level: 'local'
        },
        writeConcern: {
          w: 'majority'
        }
      }
    });
    /* eslint-enable id-length */

    try {
      await session.withTransaction(async (): Promise<void> => {
        await this.collections.domainEvents.insertMany(sanitizedDomainEvents, {
          forceServerObjectId: true
        });
      });
    } catch (ex) {
      if (ex.code === 11000 && ex.message.includes('_aggregateId_revision')) {
        throw new errors.RevisionAlreadyExists('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      session.endSession();
    }
  }

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    const snapshot = await this.collections.snapshots.findOne<Snapshot<TState>>(
      { aggregateIdentifier },
      { projection: { _id: false, revision: true, state: true }}
    );

    if (!snapshot) {
      return;
    }

    const mappedSnapshot = {
      aggregateIdentifier,
      revision: snapshot.revision,
      state: snapshot.state
    };

    return mappedSnapshot;
  }

  public async storeSnapshot <TState extends State> ({ snapshot }: {
    snapshot: Snapshot<TState>;
  }): Promise<void> {
    await this.collections.snapshots.updateOne(
      { aggregateIdentifier: snapshot.aggregateIdentifier },
      { $set: {
        ...snapshot,
        state: omitDeepBy(snapshot.state, (value): boolean => value === undefined)
      }},
      { upsert: true }
    );
  }

  public async destroy (): Promise<void> {
    this.db.removeListener('close', MongoDbDomainEventStore.onUnexpectedClose);
    await this.client.close(true);
  }
}

export { MongoDbDomainEventStore };
