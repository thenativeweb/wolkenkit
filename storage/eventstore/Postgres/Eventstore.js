'use strict';

const { PassThrough } = require('stream');

const boolean = require('boolean'),
      cloneDeep = require('lodash/cloneDeep'),
      DsnParser = require('dsn-parser'),
      limitAlphanumeric = require('limit-alphanumeric'),
      pg = require('pg'),
      QueryStream = require('pg-query-stream'),
      retry = require('async-retry');

const { Event } = require('../../../common/elements'),
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

  async initialize ({ url, namespace }) {
    if (!url) {
      throw new Error('Url is missing.');
    }
    if (!namespace) {
      throw new Error('Namespace is missing.');
    }

    this.namespace = `store_${limitAlphanumeric(namespace)}`;

    const { host, port, user, password, database, params } = new DsnParser(url).getParts();
    const ssl = boolean(params.ssl);

    this.pool = new pg.Pool({ host, port, user, password, database, ssl });
    this.pool.on('error', err => {
      throw err;
    });

    const connection = await this.getDatabase();

    this.disconnectWatcher = new pg.Client({ host, port, user, password, database, ssl });

    this.disconnectWatcher.on('error', err => {
      throw err;
    });
    this.disconnectWatcher.connect(() => {
      this.disconnectWatcher.on('end', Eventstore.onUnexpectedClose);
    });

    try {
      await retry(async () => {
        await connection.query(`
          CREATE TABLE IF NOT EXISTS "${this.namespace}_events" (
            "position" bigserial NOT NULL,
            "aggregateId" uuid NOT NULL,
            "revision" integer NOT NULL,
            "event" jsonb NOT NULL,
            "hasBeenPublished" boolean NOT NULL,

            CONSTRAINT "${this.namespace}_events_pk" PRIMARY KEY("position"),
            CONSTRAINT "${this.namespace}_aggregateId_revision" UNIQUE ("aggregateId", "revision")
          );
          CREATE TABLE IF NOT EXISTS "${this.namespace}_snapshots" (
            "aggregateId" uuid NOT NULL,
            "revision" integer NOT NULL,
            "state" jsonb NOT NULL,

            CONSTRAINT "${this.namespace}_snapshots_pk" PRIMARY KEY("aggregateId", "revision")
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

  async getLastEvent (aggregateId) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const connection = await this.getDatabase();

    try {
      const result = await connection.query({
        name: 'get last event',
        text: `
          SELECT "event", "position"
            FROM "${this.namespace}_events"
            WHERE "aggregateId" = $1
            ORDER BY "revision" DESC
            LIMIT 1
        `,
        values: [ aggregateId ]
      });

      if (result.rows.length === 0) {
        return;
      }

      const event = Event.deserialize(result.rows[0].event);

      event.metadata.position = Number(result.rows[0].position);

      return event;
    } finally {
      connection.release();
    }
  }

  async getEventStream ({
    aggregateId,
    fromRevision = 1,
    toRevision = 2 ** 31 - 1
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
        SELECT "event", "position", "hasBeenPublished"
          FROM "${this.namespace}_events"
          WHERE "aggregateId" = $1
            AND "revision" >= $2
            AND "revision" <= $3
          ORDER BY "revision"`,
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
      const event = Event.deserialize(data.event);

      event.metadata.position = Number(data.position);
      event.metadata.published = data.hasBeenPublished;

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
        SELECT "event", "position", "hasBeenPublished"
          FROM "${this.namespace}_events"
          WHERE "hasBeenPublished" = false
          ORDER BY "position"`)
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
      const event = Event.deserialize(data.event);

      event.metadata.position = Number(data.position);
      event.metadata.published = data.hasBeenPublished;
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
    if (!Array.isArray(uncommittedEvents)) {
      uncommittedEvents = [ uncommittedEvents ];
    }
    if (uncommittedEvents.length === 0) {
      throw new Error('Uncommitted events are missing.');
    }

    const committedEvents = cloneDeep(uncommittedEvents);

    const placeholders = [],
          values = [];

    for (let i = 0; i < committedEvents.length; i++) {
      const base = 4 * i + 1;
      const { event } = committedEvents[i];

      if (!event.metadata) {
        throw new Error('Metadata are missing.');
      }
      if (event.metadata.revision === undefined) {
        throw new Error('Revision is missing.');
      }
      if (event.metadata.revision < 1) {
        throw new Error('Revision must not be less than 1.');
      }

      placeholders.push(`($${base}, $${base + 1}, $${base + 2}, $${base + 3})`);
      values.push(event.aggregate.id, event.metadata.revision, event, event.metadata.published);
    }

    const connection = await this.getDatabase();

    const text = `
      INSERT INTO "${this.namespace}_events"
        ("aggregateId", "revision", "event", "hasBeenPublished")
      VALUES
        ${placeholders.join(',')} RETURNING position;
    `;

    try {
      const result = await connection.query({ name: `save events ${committedEvents.length}`, text, values });

      for (let i = 0; i < result.rows.length; i++) {
        committedEvents[i].event.metadata.position = Number(result.rows[i].position);
      }
    } catch (ex) {
      if (ex.code === '23505' && ex.detail.startsWith('Key ("aggregateId", revision)')) {
        throw new Error('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      connection.release();
    }

    const indexForSnapshot = committedEvents.findIndex(
      committedEvent => committedEvent.event.metadata.revision % 100 === 0
    );

    if (indexForSnapshot !== -1) {
      const aggregateId = committedEvents[indexForSnapshot].event.aggregate.id;
      const revision = committedEvents[indexForSnapshot].event.metadata.revision;
      const state = committedEvents[indexForSnapshot].state;

      await this.saveSnapshot({ aggregateId, revision, state });
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
            SET "hasBeenPublished" = true
            WHERE "aggregateId" = $1
              AND "revision" >= $2
              AND "revision" <= $3
        `,
        values: [ aggregateId, fromRevision, toRevision ]
      });
    } finally {
      connection.release();
    }
  }

  async getSnapshot (aggregateId) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const connection = await this.getDatabase();

    try {
      const result = await connection.query({
        name: 'get snapshot',
        text: `
          SELECT "state", "revision"
            FROM "${this.namespace}_snapshots"
            WHERE "aggregateId" = $1
            ORDER BY "revision" DESC
            LIMIT 1
        `,
        values: [ aggregateId ]
      });

      if (result.rows.length === 0) {
        return;
      }

      return {
        revision: result.rows[0].revision,
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

    state = omitByDeep(state, value => value === undefined);

    const connection = await this.getDatabase();

    try {
      await connection.query({
        name: 'save snapshot',
        text: `
        INSERT INTO "${this.namespace}_snapshots" (
          "aggregateId", revision, state
        ) VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING;
        `,
        values: [ aggregateId, revision, state ]
      });
    } finally {
      connection.release();
    }
  }

  async getReplay (options) {
    options = options || {};

    const fromPosition = options.fromPosition || 1;
    const toPosition = options.toPosition || 2 ** 31 - 1;

    if (fromPosition > toPosition) {
      throw new Error('From position is greater than to position.');
    }

    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = connection.query(
      new QueryStream(`
        SELECT "event", "position"
          FROM "${this.namespace}_events"
          WHERE "position" >= $1
            AND "position" <= $2
          ORDER BY "position"`,
      [ fromPosition, toPosition ])
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
      const event = Event.deserialize(data.event);

      event.metadata.position = Number(data.position);
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
    if (this.pool) {
      await this.pool.end();
    }
    if (this.disconnectWatcher) {
      this.disconnectWatcher.removeListener('end', Eventstore.onUnexpectedClose);
      await this.disconnectWatcher.end();
    }
  }
}

module.exports = Eventstore;
