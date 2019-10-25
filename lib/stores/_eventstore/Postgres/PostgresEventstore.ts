import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import EventExternal from '../../../common/elements/EventExternal';
import EventInternal from '../../../common/elements/EventInternal';
import { Eventstore } from '../Eventstore';
import limitAlphanumeric from '../../../common/utils/limitAlphanumeric';
import omitByDeep from '../../../common/utils/omitByDeep';
import { PassThrough } from 'stream';
import pg from 'pg';
import QueryStream from 'pg-query-stream';
import retry from 'async-retry';
import { Snapshot } from '../Snapshot';

class PostgresEventstore implements Eventstore {
  protected pool: pg.Pool;

  protected namespace: string;

  protected disconnectWatcher: pg.Client;

  protected static onUnexpectedClose (): never {
    throw new Error('Connection closed unexpectedly.');
  }

  protected static async getDatabase (pool: pg.Pool): Promise<pg.PoolClient> {
    const database = await retry(async (): Promise<pg.PoolClient> => {
      const connection = await pool.connect();

      return connection;
    });

    return database;
  }

  protected constructor ({ pool, namespace, disconnectWatcher }: {
    pool: pg.Pool;
    namespace: string;
    disconnectWatcher: pg.Client;
  }) {
    this.pool = pool;
    this.namespace = namespace;
    this.disconnectWatcher = disconnectWatcher;
  }

  public static async create ({
    hostname,
    port,
    username,
    password,
    database,
    encryptConnection = false,
    namespace
  }: {
    hostname: string;
    port: number;
    username: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    namespace: string;
  }): Promise<PostgresEventstore> {
    const prefixedNamespace = `store_${limitAlphanumeric(namespace)}`;

    const pool = new pg.Pool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      ssl: encryptConnection
    });

    pool.on('error', (err: Error): never => {
      throw err;
    });

    const disconnectWatcher = new pg.Client({
      host: hostname,
      port,
      user: username,
      password,
      database,
      ssl: encryptConnection
    });

    disconnectWatcher.on('end', PostgresEventstore.onUnexpectedClose);
    disconnectWatcher.on('error', (err: Error): never => {
      throw err;
    });

    await new Promise((resolve, reject): void => {
      try {
        disconnectWatcher.connect(resolve);
      } catch (ex) {
        reject(ex);
      }
    });

    const eventstore = new PostgresEventstore({
      pool,
      namespace: prefixedNamespace,
      disconnectWatcher
    });

    const connection = await PostgresEventstore.getDatabase(pool);

    try {
      await retry(async (): Promise<void> => {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS "${prefixedNamespace}_events" (
            "revisionGlobal" bigserial NOT NULL,
            "aggregateId" uuid NOT NULL,
            "revisionAggregate" integer NOT NULL,
            "event" jsonb NOT NULL,
            "isPublished" boolean NOT NULL,

            CONSTRAINT "${prefixedNamespace}_events_pk" PRIMARY KEY("revisionGlobal"),
            CONSTRAINT "${prefixedNamespace}_aggregateId_revisionAggregate" UNIQUE ("aggregateId", "revisionAggregate")
          );
          CREATE TABLE IF NOT EXISTS "${prefixedNamespace}_snapshots" (
            "aggregateId" uuid NOT NULL,
            "revisionAggregate" integer NOT NULL,
            "state" jsonb NOT NULL,

            CONSTRAINT "${prefixedNamespace}_snapshots_pk" PRIMARY KEY("aggregateId", "revisionAggregate")
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

    return eventstore;
  }

  public async destroy (): Promise<void> {
    this.disconnectWatcher.removeListener('end', PostgresEventstore.onUnexpectedClose);
    await this.disconnectWatcher.end();
    await this.pool.end();
  }

  public async getLastEvent ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<EventExternal | undefined> {
    const connection = await PostgresEventstore.getDatabase(this.pool);

    try {
      const result = await connection.query({
        name: 'get last event',
        text: `
          SELECT "event", "revisionGlobal"
            FROM "${this.namespace}_events"
            WHERE "aggregateId" = $1
            ORDER BY "revisionAggregate" DESC
            LIMIT 1
        `,
        values: [ aggregateIdentifier.id ]
      });

      if (result.rows.length === 0) {
        return;
      }

      let event = EventExternal.deserialize(result.rows[0].event);

      event = event.setRevisionGlobal({
        revisionGlobal: Number(result.rows[0].revisionGlobal)
      });

      return event;
    } finally {
      connection.release();
    }
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

    const connection = await PostgresEventstore.getDatabase(this.pool);

    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = connection.query(
      new QueryStream(`
        SELECT "event", "revisionGlobal", "isPublished"
          FROM "${this.namespace}_events"
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
      eventStream.removeListener('data', onData);
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      let event = EventExternal.deserialize(data.event);

      event = event.setRevisionGlobal({
        revisionGlobal: Number(data.revisionGlobal)
      });

      if (data.isPublished) {
        event = event.markAsPublished();
      }

      passThrough.write(event);
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

    eventStream.on('data', onData);
    eventStream.on('end', onEnd);
    eventStream.on('error', onError);

    return passThrough;
  }

  public async getUnpublishedEventStream (): Promise<PassThrough> {
    const connection = await PostgresEventstore.getDatabase(this.pool);

    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = connection.query(
      new QueryStream(`
        SELECT "event", "revisionGlobal", "isPublished"
          FROM "${this.namespace}_events"
          WHERE "isPublished" = false
          ORDER BY "revisionGlobal"`)
    );

    let onData: (data: any) => void,
        onEnd: () => void,
        onError: (err: Error) => void;

    const unsubscribe = function (): void {
      connection.release();
      eventStream.removeListener('data', onData);
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      let event = EventExternal.deserialize(data.event);

      event = event.setRevisionGlobal({
        revisionGlobal: Number(data.revisionGlobal)
      });

      if (data.isPublished) {
        event = event.markAsPublished();
      }

      passThrough.write(event);
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

    const placeholders = [],
          values = [];

    for (const [ index, uncommittedEvent ] of uncommittedEvents.entries()) {
      if (!(uncommittedEvent instanceof EventInternal)) {
        throw new Error('Event must be internal.');
      }

      const base = (4 * index) + 1;

      placeholders.push(`($${base}, $${base + 1}, $${base + 2}, $${base + 3})`);
      values.push(
        uncommittedEvent.aggregateIdentifier.id,
        uncommittedEvent.metadata.revision.aggregate,
        uncommittedEvent.asExternal(),
        uncommittedEvent.metadata.isPublished
      );
    }

    const connection = await PostgresEventstore.getDatabase(this.pool);

    const text = `
      INSERT INTO "${this.namespace}_events"
        ("aggregateId", "revisionAggregate", "event", "isPublished")
      VALUES
        ${placeholders.join(',')} RETURNING "revisionGlobal";
    `;

    const committedEvents = [];

    try {
      const result = await connection.query({
        name: `save events ${uncommittedEvents.length}`,
        text,
        values
      });

      for (const [ index, uncommittedEvent ] of uncommittedEvents.entries()) {
        const committedEvent = uncommittedEvent.setRevisionGlobal({
          revisionGlobal: Number(result.rows[index].revisionGlobal)
        });

        committedEvents.push(committedEvent);
      }
    } catch (ex) {
      if (ex.code === '23505' && ex.detail.startsWith('Key ("aggregateId", "revisionAggregate")')) {
        throw new Error('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      connection.release();
    }

    const indexForSnapshot = committedEvents.findIndex(
      (committedEvent): boolean => committedEvent.metadata.revision.aggregate % 100 === 0
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

    const connection = await PostgresEventstore.getDatabase(this.pool);

    try {
      await connection.query({
        name: 'mark events as published',
        text: `
          UPDATE "${this.namespace}_events"
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
  }): Promise<Snapshot | undefined> {
    const connection = await PostgresEventstore.getDatabase(this.pool);

    try {
      const result = await connection.query({
        name: 'get snapshot',
        text: `
          SELECT "state", "revisionAggregate"
            FROM "${this.namespace}_snapshots"
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
    snapshot: Snapshot;
  }): Promise<void> {
    const filteredState = omitByDeep(
      snapshot.state,
      (value): boolean => value === undefined
    );

    const connection = await PostgresEventstore.getDatabase(this.pool);

    try {
      await connection.query({
        name: 'save snapshot',
        text: `
        INSERT INTO "${this.namespace}_snapshots" (
          "aggregateId", "revisionAggregate", state
        ) VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING;
        `,
        values: [ snapshot.aggregateIdentifier.id, snapshot.revision, filteredState ]
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

    const connection = await PostgresEventstore.getDatabase(this.pool);

    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = connection.query(
      new QueryStream(`
        SELECT "event", "revisionGlobal"
          FROM "${this.namespace}_events"
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
      eventStream.removeListener('data', onData);
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
    };

    onData = function (data: any): void {
      let event = EventExternal.deserialize(data.event);

      event = event.setRevisionGlobal({
        revisionGlobal: Number(data.revisionGlobal)
      });

      passThrough.write(event);
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

    eventStream.on('data', onData);
    eventStream.on('end', onEnd);
    eventStream.on('error', onError);

    return passThrough;
  }
}

export default PostgresEventstore;
