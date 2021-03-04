import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { errors } from '../../../common/errors';
import { omitDeepBy } from '../../../common/utils/omitDeepBy';
import { PostgresDomainEventStoreOptions } from './PostgresDomainEventStoreOptions';
import QueryStream from 'pg-query-stream';
import { retry } from 'retry-ignore-abort';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { TableNames } from './TableNames';
import { Client, Pool, PoolClient } from 'pg';
import { PassThrough, Readable } from 'stream';

class PostgresDomainEventStore implements DomainEventStore {
  protected pool: Pool;

  protected tableNames: TableNames;

  protected disconnectWatcher: Client;

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected async getDatabase (): Promise<PoolClient> {
    const database = await retry(async (): Promise<PoolClient> => {
      const connection = await this.pool.connect();

      return connection;
    });

    return database;
  }

  protected constructor ({ pool, tableNames, disconnectWatcher }: {
    pool: Pool;
    tableNames: TableNames;
    disconnectWatcher: Client;
  }) {
    this.pool = pool;
    this.tableNames = tableNames;
    this.disconnectWatcher = disconnectWatcher;
  }

  public static async create ({
    hostName,
    port,
    userName,
    password,
    database,
    encryptConnection,
    tableNames
  }: PostgresDomainEventStoreOptions): Promise<PostgresDomainEventStore> {
    const pool = new Pool({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      ssl: encryptConnection
    });

    pool.on('error', (err): never => {
      throw err;
    });

    const disconnectWatcher = new Client({
      host: hostName,
      port,
      user: userName,
      password,
      database,
      ssl: encryptConnection
    });

    disconnectWatcher.on('end', PostgresDomainEventStore.onUnexpectedClose);
    disconnectWatcher.on('error', (err): never => {
      throw err;
    });

    await disconnectWatcher.connect();

    return new PostgresDomainEventStore({
      pool,
      tableNames,
      disconnectWatcher
    });
  }

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const connection = await this.getDatabase();

    try {
      const result = await connection.query({
        name: 'get last domain event',
        text: `
          SELECT "domainEvent"
            FROM "${this.tableNames.domainEvents}"
            WHERE "aggregateId" = $1
            ORDER BY "revision" DESC
            LIMIT 1
        `,
        values: [ aggregateIdentifier.aggregate.id ]
      });

      if (result.rows.length === 0) {
        return;
      }

      const domainEvent = new DomainEvent<TDomainEventData>(result.rows[0].domainEvent);

      return domainEvent;
    } finally {
      connection.release();
    }
  }

  public async getDomainEventsByCausationId ({ causationId }: {
    causationId: string;
  }): Promise<Readable> {
    const connection = await this.getDatabase();

    const domainEventStream = connection.query(
      new QueryStream(
        `SELECT "domainEvent"
          FROM "${this.tableNames.domainEvents}"
          WHERE "causationId" = $1`,
        [ causationId ]
      )
    );
    const passThrough = new PassThrough({ objectMode: true });

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      connection.release();
      domainEventStream.removeListener('data', onData);
      domainEventStream.removeListener('end', onEnd);
      domainEventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      const domainEvent = new DomainEvent<DomainEventData>(data.domainEvent);

      passThrough.write(domainEvent);
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    domainEventStream.on('data', onData);
    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);

    return passThrough;
  }

  public async hasDomainEventsWithCausationId ({ causationId }: {
    causationId: string;
  }): Promise<boolean> {
    const connection = await this.getDatabase();

    try {
      const result = await connection.query({
        name: 'has domain event with causation id',
        text: `SELECT 1
          FROM "${this.tableNames.domainEvents}"
          WHERE "causationId" = $1`,
        values: [ causationId ]
      });

      return result.rows.length > 0;
    } finally {
      connection.release();
    }
  }

  public async getDomainEventsByCorrelationId ({ correlationId }: {
    correlationId: string;
  }): Promise<Readable> {
    const connection = await this.getDatabase();

    const domainEventStream = connection.query(
      new QueryStream(
        `SELECT "domainEvent"
          FROM "${this.tableNames.domainEvents}"
          WHERE "correlationId" = $1`,
        [ correlationId ]
      )
    );
    const passThrough = new PassThrough({ objectMode: true });

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      connection.release();
      domainEventStream.removeListener('data', onData);
      domainEventStream.removeListener('end', onEnd);
      domainEventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      const domainEvent = new DomainEvent<DomainEventData>(data.domainEvent);

      passThrough.write(domainEvent);
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    domainEventStream.on('data', onData);
    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);

    return passThrough;
  }

  public async getReplay ({
    fromTimestamp = 0
  } = {}): Promise<Readable> {
    if (fromTimestamp < 0) {
      throw new errors.ParameterInvalid(`Parameter 'fromTimestamp' must be at least 0.`);
    }

    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(
      new QueryStream(`
        SELECT "domainEvent"
          FROM "${this.tableNames.domainEvents}"
          WHERE "timestamp" >= $1
          ORDER BY "aggregateId", "revision"`,
      [ fromTimestamp ])
    );

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      connection.release();
      domainEventStream.removeListener('data', onData);
      domainEventStream.removeListener('end', onEnd);
      domainEventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      const domainEvent = new DomainEvent<DomainEventData>(data.domainEvent);

      passThrough.write(domainEvent);
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    domainEventStream.on('data', onData);
    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);

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

    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(
      new QueryStream(`
        SELECT "domainEvent"
          FROM "${this.tableNames.domainEvents}"
          WHERE "aggregateId" = $1
            AND "revision" >= $2
            AND "revision" <= $3
          ORDER BY "revision"`,
      [ aggregateId, fromRevision, toRevision ])
    );

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      connection.release();
      domainEventStream.removeListener('data', onData);
      domainEventStream.removeListener('end', onEnd);
      domainEventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      const domainEvent = new DomainEvent<DomainEventData>(data.domainEvent);

      passThrough.write(domainEvent);
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
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

    const placeholders = [],
          values = [];

    for (const [ index, domainEvent ] of domainEvents.entries()) {
      const base = (6 * index) + 1;

      placeholders.push(`($${base}, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      values.push(
        domainEvent.aggregateIdentifier.aggregate.id,
        domainEvent.metadata.revision,
        domainEvent.metadata.causationId,
        domainEvent.metadata.correlationId,
        domainEvent.metadata.timestamp,
        omitDeepBy(domainEvent, (value): boolean => value === undefined)
      );
    }

    const connection = await this.getDatabase();

    const text = `
      INSERT INTO "${this.tableNames.domainEvents}"
        ("aggregateId", "revision", "causationId", "correlationId", "timestamp", "domainEvent")
      VALUES
        ${placeholders.join(',')};
    `;

    try {
      await connection.query({
        name: `store domain events ${domainEvents.length}`,
        text,
        values
      });
    } catch (ex: unknown) {
      if ((ex as any).code === '23505' && (ex as any).detail?.startsWith('Key ("aggregateId", revision)')) {
        throw new errors.RevisionAlreadyExists('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      connection.release();
    }
  }

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    const connection = await this.getDatabase();

    try {
      const result = await connection.query({
        name: 'get snapshot',
        text: `
          SELECT "state", "revision"
            FROM "${this.tableNames.snapshots}"
            WHERE "aggregateId" = $1
            ORDER BY "revision" DESC
            LIMIT 1
        `,
        values: [ aggregateIdentifier.aggregate.id ]
      });

      if (result.rows.length === 0) {
        return;
      }

      return {
        aggregateIdentifier,
        revision: result.rows[0].revision,
        state: result.rows[0].state
      };
    } finally {
      connection.release();
    }
  }

  public async storeSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    const connection = await this.getDatabase();

    try {
      await connection.query({
        name: 'store snapshot',
        text: `
        INSERT INTO "${this.tableNames.snapshots}" (
          "aggregateId", "revision", state
        ) VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING;
        `,
        values: [
          snapshot.aggregateIdentifier.aggregate.id,
          snapshot.revision,
          omitDeepBy(snapshot.state, (value): boolean => value === undefined)
        ]
      });
    } finally {
      connection.release();
    }
  }

  public async getAggregateIdentifiers (): Promise<Readable> {
    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(
      new QueryStream(`
        SELECT "domainEvent", "timestamp"
          FROM "${this.tableNames.domainEvents}"
          WHERE "revision" = 1
          ORDER BY "timestamp"`)
    );

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      connection.release();
      domainEventStream.removeListener('data', onData);
      domainEventStream.removeListener('end', onEnd);
      domainEventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      passThrough.write(data.domainEvent.aggregateIdentifier);
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    domainEventStream.on('data', onData);
    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);

    return passThrough;
  }

  public async getAggregateIdentifiersByName ({ contextName, aggregateName }: {
    contextName: string;
    aggregateName: string;
  }): Promise<Readable> {
    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(
      new QueryStream(`
        SELECT "domainEvent", "timestamp"
          FROM "${this.tableNames.domainEvents}"
          WHERE "revision" = 1
          ORDER BY "timestamp"`)
    );

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      connection.release();
      domainEventStream.removeListener('data', onData);
      domainEventStream.removeListener('end', onEnd);
      domainEventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      if (
        data.domainEvent.aggregateIdentifier.context.name !== contextName ||
          data.domainEvent.aggregateIdentifier.aggregate.name !== aggregateName
      ) {
        return;
      }

      passThrough.write(data.domainEvent.aggregateIdentifier);
    };

    onEnd = function (): void {
      unsubscribe();
      passThrough.end();
    };

    onError = function (err: Error): void {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    domainEventStream.on('data', onData);
    domainEventStream.on('end', onEnd);
    domainEventStream.on('error', onError);

    return passThrough;
  }

  public async setup (): Promise<void> {
    const connection = await this.getDatabase();

    try {
      await retry(async (): Promise<void> => {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS "${this.tableNames.domainEvents}" (
            "aggregateId" uuid NOT NULL,
            "revision" integer NOT NULL,
            "causationId" uuid NOT NULL,
            "correlationId" uuid NOT NULL,
            "timestamp" bigint NOT NULL,
            "domainEvent" jsonb NOT NULL,

            CONSTRAINT "${this.tableNames.domainEvents}_pk" PRIMARY KEY ("aggregateId", "revision")
          );
          CREATE TABLE IF NOT EXISTS "${this.tableNames.snapshots}" (
            "aggregateId" uuid NOT NULL,
            "revision" integer NOT NULL,
            "state" jsonb NOT NULL,

            CONSTRAINT "${this.tableNames.snapshots}_pk" PRIMARY KEY ("aggregateId", "revision")
          );
        `);
      }, {
        retries: 3,
        minTimeout: 100,
        factor: 1
      });
    } finally {
      connection.release();
    }
  }

  public async destroy (): Promise<void> {
    this.disconnectWatcher.removeListener('end', PostgresDomainEventStore.onUnexpectedClose);
    await this.disconnectWatcher.end();
    await this.pool.end();
  }
}

export { PostgresDomainEventStore };
