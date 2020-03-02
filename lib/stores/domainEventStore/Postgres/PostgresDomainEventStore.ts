import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { errors } from '../../../common/errors';
import { omitDeepBy } from '../../../common/utils/omitDeepBy';
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

  protected static async getDatabase (pool: Pool): Promise<PoolClient> {
    const database = await retry(async (): Promise<PoolClient> => {
      const connection = await pool.connect();

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
    encryptConnection = false,
    tableNames
  }: {
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    tableNames: TableNames;
  }): Promise<PostgresDomainEventStore> {
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

    await new Promise((resolve, reject): void => {
      try {
        disconnectWatcher.connect(resolve);
      } catch (ex) {
        reject(ex);
      }
    });

    const domainEventStore = new PostgresDomainEventStore({
      pool,
      tableNames,
      disconnectWatcher
    });

    const connection = await PostgresDomainEventStore.getDatabase(pool);

    try {
      await retry(async (): Promise<void> => {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS "${tableNames.domainEvents}" (
            "revisionGlobal" bigserial NOT NULL,
            "aggregateId" uuid NOT NULL,
            "revisionAggregate" integer NOT NULL,
            "causationId" uuid NOT NULL,
            "correlationId" uuid NOT NULL,
            "domainEvent" jsonb NOT NULL,

            CONSTRAINT "${tableNames.domainEvents}_pk" PRIMARY KEY ("revisionGlobal"),
            CONSTRAINT "${tableNames.domainEvents}_aggregateId_revisionAggregate" UNIQUE ("aggregateId", "revisionAggregate")
          );
          CREATE TABLE IF NOT EXISTS "${tableNames.snapshots}" (
            "aggregateId" uuid NOT NULL,
            "revisionAggregate" integer NOT NULL,
            "state" jsonb NOT NULL,

            CONSTRAINT "${tableNames.snapshots}_pk" PRIMARY KEY ("aggregateId", "revisionAggregate")
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

    return domainEventStore;
  }

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    try {
      const result = await connection.query({
        name: 'get last domain event',
        text: `
          SELECT "domainEvent", "revisionGlobal"
            FROM "${this.tableNames.domainEvents}"
            WHERE "aggregateId" = $1
            ORDER BY "revisionAggregate" DESC
            LIMIT 1
        `,
        values: [ aggregateIdentifier.id ]
      });

      if (result.rows.length === 0) {
        return;
      }

      let domainEvent = new DomainEvent<TDomainEventData>(result.rows[0].domainEvent);

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(result.rows[0].revisionGlobal)
      });

      return domainEvent;
    } finally {
      connection.release();
    }
  }

  public async getDomainEventsByCausationId <TDomainEventData extends DomainEventData> ({ causationId }: {
    causationId: string;
  }): Promise<Readable> {
    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    const domainEventStream = connection.query(
      new QueryStream(
        `SELECT "domainEvent", "revisionGlobal"
            FROM "${this.tableNames.domainEvents}"
            WHERE "causationId" = $1
            ORDER BY "revisionGlobal" ASC`,
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
      let domainEvent = new DomainEvent<DomainEventData>(data.domainEvent);

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(data.revisionGlobal)
      });

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
    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    try {
      const result = await connection.query({
        name: 'has domain event with causation id',
        text: `SELECT COUNT(*) as count
          FROM "${this.tableNames.domainEvents}"
          WHERE "causationId" = $1`,
        values: [ causationId ]
      });

      return Number(result.rows[0].count) !== 0;
    } finally {
      connection.release();
    }
  }

  public async getDomainEventsByCorrelationId <TDomainEventData extends DomainEventData> ({ correlationId }: {
    correlationId: string;
  }): Promise<Readable> {
    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    const domainEventStream = connection.query(
      new QueryStream(
        `SELECT "domainEvent", "revisionGlobal"
            FROM "${this.tableNames.domainEvents}"
            WHERE "correlationId" = $1
            ORDER BY "revisionGlobal" ASC`,
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
      let domainEvent = new DomainEvent<DomainEventData>(data.domainEvent);

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(data.revisionGlobal)
      });

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
    fromRevisionGlobal = 1,
    toRevisionGlobal = (2 ** 31) - 1
  } = {}): Promise<Readable> {
    if (fromRevisionGlobal < 1) {
      throw new errors.ParameterInvalid(`Parameter 'fromRevisionGlobal' must be at least 1.`);
    }
    if (toRevisionGlobal < 1) {
      throw new errors.ParameterInvalid(`Parameter 'toRevisionGlobal' must be at least 1.`);
    }
    if (fromRevisionGlobal > toRevisionGlobal) {
      throw new errors.ParameterInvalid(`Parameter 'toRevisionGlobal' must be greater or equal to 'fromRevisionGlobal'.`);
    }

    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(
      new QueryStream(`
        SELECT "domainEvent", "revisionGlobal"
          FROM "${this.tableNames.domainEvents}"
          WHERE "revisionGlobal" >= $1
            AND "revisionGlobal" <= $2
          ORDER BY "revisionGlobal"`,
      [ fromRevisionGlobal, toRevisionGlobal ])
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
      let domainEvent = new DomainEvent<DomainEventData>(data.domainEvent);

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(data.revisionGlobal)
      });

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

    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(
      new QueryStream(`
        SELECT "domainEvent", "revisionGlobal"
          FROM "${this.tableNames.domainEvents}"
          WHERE "aggregateId" = $1
            AND "revisionAggregate" >= $2
            AND "revisionAggregate" <= $3
          ORDER BY "revisionAggregate"`,
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
      let domainEvent = new DomainEvent<DomainEventData>(data.domainEvent);

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(data.revisionGlobal)
      });

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
  }): Promise<DomainEvent<TDomainEventData>[]> {
    if (domainEvents.length === 0) {
      throw new errors.ParameterInvalid('Domain events are missing.');
    }

    const placeholders = [],
          values = [];

    for (const [ index, domainEvent ] of domainEvents.entries()) {
      const base = (5 * index) + 1;

      placeholders.push(`($${base}, $${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`);
      values.push(
        domainEvent.aggregateIdentifier.id,
        domainEvent.metadata.revision.aggregate,
        domainEvent.metadata.causationId,
        domainEvent.metadata.correlationId,
        domainEvent
      );
    }

    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    const text = `
      INSERT INTO "${this.tableNames.domainEvents}"
        ("aggregateId", "revisionAggregate", "causationId", "correlationId", "domainEvent")
      VALUES
        ${placeholders.join(',')} RETURNING "revisionGlobal";
    `;

    const savedDomainEvents = [];

    try {
      const result = await connection.query({
        name: `store domain events ${domainEvents.length}`,
        text,
        values
      });

      for (const [ index, domainEvent ] of domainEvents.entries()) {
        const savedDomainEvent = new DomainEvent<TDomainEventData>({
          ...domainEvent.withRevisionGlobal({
            revisionGlobal: Number(result.rows[index].revisionGlobal)
          }),
          data: omitDeepBy(domainEvent.data, (value): boolean => value === undefined)
        });

        savedDomainEvents.push(savedDomainEvent);
      }
    } catch (ex) {
      if (ex.code === '23505' && ex.detail.startsWith('Key ("aggregateId", "revisionAggregate")')) {
        throw new errors.RevisionAlreadyExists('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      connection.release();
    }

    return savedDomainEvents;
  }

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    try {
      const result = await connection.query({
        name: 'get snapshot',
        text: `
          SELECT "state", "revisionAggregate"
            FROM "${this.tableNames.snapshots}"
            WHERE "aggregateId" = $1
            ORDER BY "revisionAggregate" DESC
            LIMIT 1
        `,
        values: [ aggregateIdentifier.id ]
      });

      if (result.rows.length === 0) {
        return;
      }

      return {
        aggregateIdentifier,
        revision: result.rows[0].revisionAggregate,
        state: result.rows[0].state
      };
    } finally {
      connection.release();
    }
  }

  public async storeSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    try {
      await connection.query({
        name: 'store snapshot',
        text: `
        INSERT INTO "${this.tableNames.snapshots}" (
          "aggregateId", "revisionAggregate", state
        ) VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING;
        `,
        values: [
          snapshot.aggregateIdentifier.id,
          snapshot.revision,
          omitDeepBy(snapshot.state, (value): boolean => value === undefined)
        ]
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
