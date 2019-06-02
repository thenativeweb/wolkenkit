'use strict';

const { PassThrough } = require('stream');

const limitAlphanumeric = require('limit-alphanumeric'),
      pg = require('pg'),
      QueryStream = require('pg-query-stream'),
      retry = require('async-retry');

const { EventExternal, EventInternal } = require('../../../common/elements'),
      omitByDeep = require('../omitByDeep');

class Eventstore {
  static onUnexpectedClose () {
    throw new Error('Connection closed unexpectedly.');
  }

  async getDatabase () {
    const database = await retry(async () => {
      const connection = await this.pool.connect();

      return connection;
    });

    return database;
  }

  async initialize ({
    hostname,
    port,
    username,
    password,
    database,
    encryptConnection = false,
    namespace
  }) {
    if (!hostname) {
      throw new Error('Hostname is missing.');
    }
    if (!port) {
      throw new Error('Port is missing.');
    }
    if (!username) {
      throw new Error('Username is missing.');
    }
    if (!password) {
      throw new Error('Password is missing.');
    }
    if (!database) {
      throw new Error('Database is missing.');
    }
    if (!namespace) {
      throw new Error('Namespace is missing.');
    }

    this.namespace = `store_${limitAlphanumeric(namespace)}`;

    this.pool = new pg.Pool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      ssl: encryptConnection
    });

    this.pool.on('error', err => {
      throw err;
    });

    const connection = await this.getDatabase();

    this.disconnectWatcher = new pg.Client({
      host: hostname,
      port,
      user: username,
      password,
      database,
      ssl: encryptConnection
    });

    this.disconnectWatcher.on('end', Eventstore.onUnexpectedClose);
    this.disconnectWatcher.on('error', err => {
      throw err;
    });

    await new Promise(resolve => {
      this.disconnectWatcher.connect(resolve);
    });

    try {
      await retry(async () => {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS "${this.namespace}_events" (
            "revisionGlobal" bigserial NOT NULL,
            "aggregateId" uuid NOT NULL,
            "revisionAggregate" integer NOT NULL,
            "event" jsonb NOT NULL,
            "isPublished" boolean NOT NULL,

            CONSTRAINT "${this.namespace}_events_pk" PRIMARY KEY("revisionGlobal"),
            CONSTRAINT "${this.namespace}_aggregateId_revisionAggregate" UNIQUE ("aggregateId", "revisionAggregate")
          );
          CREATE TABLE IF NOT EXISTS "${this.namespace}_snapshots" (
            "aggregateId" uuid NOT NULL,
            "revisionAggregate" integer NOT NULL,
            "state" jsonb NOT NULL,

            CONSTRAINT "${this.namespace}_snapshots_pk" PRIMARY KEY("aggregateId", "revisionAggregate")
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

  async getLastEvent ({ aggregateId }) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const connection = await this.getDatabase();

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
        values: [ aggregateId ]
      });

      if (result.rows.length === 0) {
        return;
      }

      let event = EventExternal.fromObject(result.rows[0].event);

      event = event.setRevisionGlobal({
        revisionGlobal: Number(result.rows[0].revisionGlobal)
      });

      return event;
    } finally {
      connection.release();
    }
  }

  async getEventStream ({
    aggregateId,
    fromRevision = 1,
    toRevision = (2 ** 31) - 1
  }) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }
    if (fromRevision > toRevision) {
      throw new Error('From revision is greater than to revision.');
    }

    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = connection.query(
      new QueryStream(`
        SELECT "event", "revisionGlobal", "isPublished"
          FROM "${this.namespace}_events"
          WHERE "aggregateId" = $1
            AND "revisionAggregate" >= $2
            AND "revisionAggregate" <= $3
          ORDER BY "revisionAggregate"`,
      [ aggregateId, fromRevision, toRevision ])
    );

    let onData,
        onEnd,
        onError;

    const unsubscribe = function () {
      connection.release();
      eventStream.removeListener('data', onData);
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
    };

    onData = function (data) {
      let event = EventExternal.fromObject(data.event);

      event = event.setRevisionGlobal({
        revisionGlobal: Number(data.revisionGlobal)
      });

      if (data.isPublished) {
        event = event.markAsPublished();
      }

      passThrough.write(event);
    };

    onEnd = function () {
      unsubscribe();
      passThrough.end();
    };

    onError = function (err) {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    eventStream.on('data', onData);
    eventStream.on('end', onEnd);
    eventStream.on('error', onError);

    return passThrough;
  }

  async getUnpublishedEventStream () {
    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = connection.query(
      new QueryStream(`
        SELECT "event", "revisionGlobal", "isPublished"
          FROM "${this.namespace}_events"
          WHERE "isPublished" = false
          ORDER BY "revisionGlobal"`)
    );

    let onData,
        onEnd,
        onError;

    const unsubscribe = function () {
      connection.release();
      eventStream.removeListener('data', onData);
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
    };

    onData = function (data) {
      let event = EventExternal.fromObject(data.event);

      event = event.setRevisionGlobal({
        revisionGlobal: Number(data.revisionGlobal)
      });

      if (data.isPublished) {
        event = event.markAsPublished();
      }

      passThrough.write(event);
    };

    onEnd = function () {
      unsubscribe();
      passThrough.end();
    };

    onError = function (err) {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    eventStream.on('data', onData);
    eventStream.on('end', onEnd);
    eventStream.on('error', onError);

    return passThrough;
  }

  async saveEvents ({ uncommittedEvents }) {
    if (!uncommittedEvents) {
      throw new Error('Uncommitted events are missing.');
    }
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
        uncommittedEvent.aggregate.id,
        uncommittedEvent.metadata.revision.aggregate,
        uncommittedEvent.asExternal(),
        uncommittedEvent.metadata.isPublished
      );
    }

    const connection = await this.getDatabase();

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
      committedEvent => committedEvent.metadata.revision.aggregate % 100 === 0
    );

    if (indexForSnapshot !== -1) {
      const aggregateId = committedEvents[indexForSnapshot].aggregate.id;
      const { aggregate: revisionAggregate } = committedEvents[indexForSnapshot].metadata.revision;
      const { state } = committedEvents[indexForSnapshot].annotations;

      await this.saveSnapshot({ aggregateId, revision: revisionAggregate, state });
    }

    return committedEvents;
  }

  async markEventsAsPublished ({ aggregateId, fromRevision, toRevision }) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }
    if (!fromRevision) {
      throw new Error('From revision is missing.');
    }
    if (!toRevision) {
      throw new Error('To revision is missing.');
    }

    if (fromRevision > toRevision) {
      throw new Error('From revision is greater than to revision.');
    }

    const connection = await this.getDatabase();

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
        values: [ aggregateId, fromRevision, toRevision ]
      });
    } finally {
      connection.release();
    }
  }

  async getSnapshot ({ aggregateId }) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const connection = await this.getDatabase();

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
        values: [ aggregateId ]
      });

      if (result.rows.length === 0) {
        return;
      }

      return {
        revision: result.rows[0].revisionAggregate,
        state: result.rows[0].state
      };
    } finally {
      connection.release();
    }
  }

  async saveSnapshot ({ aggregateId, revision, state }) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }
    if (!revision) {
      throw new Error('Revision is missing.');
    }
    if (!state) {
      throw new Error('State is missing.');
    }

    const filteredState = omitByDeep(state, value => value === undefined);

    const connection = await this.getDatabase();

    try {
      await connection.query({
        name: 'save snapshot',
        text: `
        INSERT INTO "${this.namespace}_snapshots" (
          "aggregateId", "revisionAggregate", state
        ) VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING;
        `,
        values: [ aggregateId, revision, filteredState ]
      });
    } finally {
      connection.release();
    }
  }

  async getReplay ({
    fromRevisionGlobal = 1,
    toRevisionGlobal = (2 ** 31) - 1
  } = {}) {
    if (fromRevisionGlobal > toRevisionGlobal) {
      throw new Error('From revision global is greater than to revision global.');
    }

    const connection = await this.getDatabase();

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

    let onData,
        onEnd,
        onError;

    const unsubscribe = function () {
      connection.release();
      eventStream.removeListener('data', onData);
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
    };

    onData = function (data) {
      let event = EventExternal.fromObject(data.event);

      event = event.setRevisionGlobal({
        revisionGlobal: Number(data.revisionGlobal)
      });

      passThrough.write(event);
    };

    onEnd = function () {
      unsubscribe();
      passThrough.end();
    };

    onError = function (err) {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    eventStream.on('data', onData);
    eventStream.on('end', onEnd);
    eventStream.on('error', onError);

    return passThrough;
  }

  async destroy () {
    if (this.disconnectWatcher) {
      this.disconnectWatcher.removeListener('end', Eventstore.onUnexpectedClose);
      await this.disconnectWatcher.end();
    }
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = Eventstore;
