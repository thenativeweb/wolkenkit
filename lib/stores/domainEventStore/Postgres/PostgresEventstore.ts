import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { PassThrough } from 'stream';
import QueryStream from 'pg-query-stream';
import retry from 'async-retry';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { TableNames } from './TableNames';
import { Client, Pool, PoolClient } from 'pg';

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
    hostname,
    port,
    username,
    password,
    database,
    encryptConnection = false,
    tableNames
  }: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    tableNames: TableNames;
  }): Promise<PostgresDomainEventStore> {
    const pool = new Pool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      ssl: encryptConnection
    });

    pool.on('error', (err): never => {
      throw err;
    });

    const disconnectWatcher = new Client({
      host: hostname,
      port,
      user: username,
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
            "domainEvent" jsonb NOT NULL,
            "isPublished" boolean NOT NULL,

            CONSTRAINT "${tableNames.domainEvents}_pk" PRIMARY KEY("revisionGlobal"),
            CONSTRAINT "${tableNames.domainEvents}_aggregateId_revisionAggregate" UNIQUE ("aggregateId", "revisionAggregate")
          );
          CREATE TABLE IF NOT EXISTS "${tableNames.snapshots}" (
            "aggregateId" uuid NOT NULL,
            "revisionAggregate" integer NOT NULL,
            "state" jsonb NOT NULL,

            CONSTRAINT "${tableNames.snapshots}_pk" PRIMARY KEY("aggregateId", "revisionAggregate")
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

  public async destroy (): Promise<void> {
    this.disconnectWatcher.removeListener('end', PostgresDomainEventStore.onUnexpectedClose);
    await this.disconnectWatcher.end();
    await this.pool.end();
  }

  public async getLastDomainEvent ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<DomainEventData> | undefined> {
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

      let domainEvent = new DomainEvent<DomainEventData>(result.rows[0].domainEvent);

      domainEvent = domainEvent.withRevisionGlobal({
        revisionGlobal: Number(result.rows[0].revisionGlobal)
      });

      return domainEvent;
    } finally {
      connection.release();
    }
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

    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(
      new QueryStream(`
        SELECT "domainEvent", "revisionGlobal", "isPublished"
          FROM "${this.tableNames.domainEvents}"
          WHERE "aggregateId" = $1
            AND "revisionAggregate" >= $2
            AND "revisionAggregate" <= $3
          ORDER BY "revisionAggregate"`,
      [ aggregateIdentifier.id, fromRevision, toRevision ])
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

      if (data.isPublished) {
        domainEvent = domainEvent.asPublished();
      }

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

  public async getUnpublishedDomainEventStream (): Promise<PassThrough> {
    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    const passThrough = new PassThrough({ objectMode: true });
    const domainEventStream = connection.query(
      new QueryStream(`
        SELECT "domainEvent", "revisionGlobal", "isPublished"
          FROM "${this.tableNames.domainEvents}"
          WHERE "isPublished" = false
          ORDER BY "revisionGlobal"`)
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

      if (data.isPublished) {
        domainEvent = domainEvent.asPublished();
      }

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

  public async saveDomainEvents ({ domainEvents }: {
    domainEvents: DomainEvent<DomainEventData>[];
  }): Promise<DomainEvent<DomainEventData>[]> {
    if (domainEvents.length === 0) {
      throw new Error('Domain events are missing.');
    }

    const placeholders = [],
          values = [];

    for (const [ index, domainEvent ] of domainEvents.entries()) {
      const base = (4 * index) + 1;

      placeholders.push(`($${base}, $${base + 1}, $${base + 2}, $${base + 3})`);
      values.push(
        domainEvent.aggregateIdentifier.id,
        domainEvent.metadata.revision.aggregate,
        domainEvent,
        domainEvent.metadata.isPublished
      );
    }

    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    const text = `
      INSERT INTO "${this.tableNames.domainEvents}"
        ("aggregateId", "revisionAggregate", "domainEvent", "isPublished")
      VALUES
        ${placeholders.join(',')} RETURNING "revisionGlobal";
    `;

    const savedDomainEvents = [];

    try {
      const result = await connection.query({
        name: `save domain events ${domainEvents.length}`,
        text,
        values
      });

      for (const [ index, domainEvent ] of domainEvents.entries()) {
        const savedDomainEvent = domainEvent.withRevisionGlobal({
          revisionGlobal: Number(result.rows[index].revisionGlobal)
        });

        savedDomainEvents.push(savedDomainEvent);
      }
    } catch (ex) {
      if (ex.code === '23505' && ex.detail.startsWith('Key ("aggregateId", "revisionAggregate")')) {
        throw new Error('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      connection.release();
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

    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    try {
      await connection.query({
        name: 'mark domain events as published',
        text: `
          UPDATE "${this.tableNames.domainEvents}"
            SET "isPublished" = true
            WHERE "aggregateId" = $1
              AND "revisionAggregate" >= $2
              AND "revisionAggregate" <= $3
        `,
        values: [ aggregateIdentifier.id, fromRevision, toRevision ]
      });
    } finally {
      connection.release();
    }
  }

  public async getSnapshot ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<State> | undefined> {
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

  public async saveSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    const connection = await PostgresDomainEventStore.getDatabase(this.pool);

    try {
      await connection.query({
        name: 'save snapshot',
        text: `
        INSERT INTO "${this.tableNames.snapshots}" (
          "aggregateId", "revisionAggregate", state
        ) VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING;
        `,
        values: [ snapshot.aggregateIdentifier.id, snapshot.revision, snapshot.state ]
      });
    } finally {
      connection.release();
    }
  }

  public async getReplay ({
    fromRevisionGlobal = 1,
    toRevisionGlobal = (2 ** 31) - 1
  } = {}): Promise<PassThrough> {
    if (fromRevisionGlobal > toRevisionGlobal) {
      throw new Error('From revision global is greater than to revision global.');
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
}

export { PostgresDomainEventStore };
