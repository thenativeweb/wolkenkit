'use strict';

const { PassThrough } = require('stream');

const cloneDeep = require('lodash/cloneDeep'),
      limitAlphanumeric = require('limit-alphanumeric'),
      mysql = require('mysql2/promise'),
      retry = require('async-retry');

const { Event } = require('../../../common/elements'),
      omitByDeep = require('../omitByDeep');

class Eventstore {
  static onUnexpectedClose () {
    throw new Error('Connection closed unexpectedly.');
  }

  async getDatabase () {
    const database = await retry(async () => {
      const connection = await this.pool.getConnection();

      return connection;
    });

    return database;
  }

  async initialize ({ hostname, port, username, password, database, namespace }) {
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

    this.pool = mysql.createPool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      multipleStatements: true
    });

    this.pool.on('connection', connection => {
      connection.on('error', err => {
        throw err;
      });
      connection.on('end', Eventstore.onUnexpectedClose);
    });

    const connection = await this.getDatabase();

    const createUuidToBinFunction = `
      CREATE FUNCTION UuidToBin(_uuid BINARY(36))
        RETURNS BINARY(16)
        RETURN UNHEX(CONCAT(
          SUBSTR(_uuid, 15, 4),
          SUBSTR(_uuid, 10, 4),
          SUBSTR(_uuid, 1, 8),
          SUBSTR(_uuid, 20, 4),
          SUBSTR(_uuid, 25)
        ));
    `;

    try {
      await connection.query(createUuidToBinFunction);
    } catch (ex) {
      // If the function already exists, we can ignore this error; otherwise
      // rethrow it. Generally speaking, this should be done using a SQL clause
      // such as 'IF NOT EXISTS', but MySQL does not support this yet. Also,
      // there is a ready-made function UUID_TO_BIN, but this is only available
      // from MySQL 8.0 upwards.
      if (!ex.message.includes('FUNCTION UuidToBin already exists')) {
        throw ex;
      }
    }

    const createUuidFromBinFunction = `
      CREATE FUNCTION UuidFromBin(_bin BINARY(16))
        RETURNS BINARY(36)
        RETURN LCASE(CONCAT_WS('-',
          HEX(SUBSTR(_bin,  5, 4)),
          HEX(SUBSTR(_bin,  3, 2)),
          HEX(SUBSTR(_bin,  1, 2)),
          HEX(SUBSTR(_bin,  9, 2)),
          HEX(SUBSTR(_bin, 11))
        ));
    `;

    try {
      await connection.query(createUuidFromBinFunction);
    } catch (ex) {
      // If the function already exists, we can ignore this error; otherwise
      // rethrow it. Generally speaking, this should be done using a SQL clause
      // such as 'IF NOT EXISTS', but MySQL does not support this yet. Also,
      // there is a ready-made function BIN_TO_UUID, but this is only available
      // from MySQL 8.0 upwards.
      if (!ex.message.includes('FUNCTION UuidFromBin already exists')) {
        throw ex;
      }
    }

    const query = `
      CREATE TABLE IF NOT EXISTS ${this.namespace}_events (
        position SERIAL,
        aggregateId BINARY(16) NOT NULL,
        revision INT NOT NULL,
        event JSON NOT NULL,
        hasBeenPublished BOOLEAN NOT NULL,

        PRIMARY KEY(position),
        UNIQUE (aggregateId, revision)
      ) ENGINE = InnoDB;

      CREATE TABLE IF NOT EXISTS ${this.namespace}_snapshots (
        aggregateId BINARY(16) NOT NULL,
        revision INT NOT NULL,
        state JSON NOT NULL,

        PRIMARY KEY(aggregateId, revision)
      ) ENGINE = InnoDB;
    `;

    await connection.query(query);

    await connection.release();
  }

  async getLastEvent (aggregateId) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const connection = await this.getDatabase();

    try {
      const [ rows ] = await connection.execute(`
        SELECT event, position
          FROM ${this.namespace}_events
            WHERE aggregateId = UuidToBin(?)
          ORDER BY revision DESC
          LIMIT 1
        `, [ aggregateId ]);

      if (rows.length === 0) {
        return;
      }

      const event = Event.deserialize(rows[0].event);

      event.annotations.position = Number(rows[0].position);

      return event;
    } finally {
      await connection.release();
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
    const eventStream = connection.connection.execute(`
      SELECT event, position, hasBeenPublished
        FROM ${this.namespace}_events
        WHERE aggregateId = UuidToBin(?)
          AND revision >= ?
          AND revision <= ?
        ORDER BY revision`,
    [ aggregateId, fromRevision, toRevision ]);

    let onEnd,
        onError,
        onResult;

    const unsubscribe = function () {
      connection.release();
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
      eventStream.removeListener('result', onResult);
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

    onResult = function (row) {
      const event = Event.deserialize(row.event);

      event.annotations.position = Number(row.position);
      event.metadata.isPublished = Boolean(row.hasBeenPublished);

      passThrough.write(event);
    };

    eventStream.on('end', onEnd);
    eventStream.on('error', onError);
    eventStream.on('result', onResult);

    return passThrough;
  }

  async getUnpublishedEventStream () {
    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = connection.connection.execute(`
      SELECT event, position, hasBeenPublished
        FROM ${this.namespace}_events
        WHERE hasBeenPublished = false
        ORDER BY position
    `);

    let onEnd,
        onError,
        onResult;

    const unsubscribe = function () {
      connection.release();
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
      eventStream.removeListener('result', onResult);
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

    onResult = function (row) {
      const event = Event.deserialize(row.event);

      event.annotations.position = Number(row.position);
      event.metadata.isPublished = Boolean(row.hasBeenPublished);
      passThrough.write(event);
    };

    eventStream.on('end', onEnd);
    eventStream.on('error', onError);
    eventStream.on('result', onResult);

    return passThrough;
  }

  async saveEvents ({ uncommittedEvents }) {
    if (!uncommittedEvents) {
      throw new Error('Uncommitted events are missing.');
    }
    if (uncommittedEvents.length === 0) {
      throw new Error('Uncommitted events are missing.');
    }

    const committedEvents = cloneDeep(uncommittedEvents);

    const connection = await this.getDatabase();

    const placeholders = [],
          values = [];

    for (let i = 0; i < committedEvents.length; i++) {
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

      placeholders.push('(UuidToBin(?), ?, ?, ?)');
      values.push(event.aggregate.id, event.metadata.revision, JSON.stringify(event), event.metadata.isPublished);
    }

    const text = `
      INSERT INTO ${this.namespace}_events
        (aggregateId, revision, event, hasBeenPublished)
      VALUES
        ${placeholders.join(',')};
    `;

    try {
      await connection.execute(text, values);

      const [ rows ] = await connection.execute('SELECT LAST_INSERT_ID() AS position;');

      // We only get the ID of the first inserted row, but since it's all in a
      // single INSERT statement, the database guarantees that the positions are
      // sequential, so we easily calculate them by ourselves.
      for (let i = 0; i < committedEvents.length; i++) {
        committedEvents[i].event.annotations.position = Number(rows[0].position) + i;
      }
    } catch (ex) {
      if (ex.code === 'ER_DUP_ENTRY' && ex.sqlMessage.endsWith('for key \'aggregateId\'')) {
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
      const { revision } = committedEvents[indexForSnapshot].event.metadata;
      const { state } = committedEvents[indexForSnapshot];

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
      await connection.execute(`
        UPDATE ${this.namespace}_events
          SET hasBeenPublished = true
          WHERE aggregateId = UuidToBin(?)
            AND revision >= ?
            AND revision <= ?
      `, [ aggregateId, fromRevision, toRevision ]);
    } finally {
      await connection.release();
    }
  }

  async getSnapshot (aggregateId) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const connection = await this.getDatabase();

    try {
      const [ rows ] = await connection.execute(`
        SELECT state, revision
          FROM ${this.namespace}_snapshots
          WHERE aggregateId = UuidToBin(?)
          ORDER BY revision DESC
          LIMIT 1
      `, [ aggregateId ]);

      if (rows.length === 0) {
        return;
      }

      return {
        revision: rows[0].revision,
        state: rows[0].state
      };
    } finally {
      await connection.release();
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
      await connection.execute(`
        INSERT IGNORE INTO ${this.namespace}_snapshots
          (aggregateId, revision, state)
          VALUES (UuidToBin(?), ?, ?);
      `, [ aggregateId, revision, JSON.stringify(filteredState) ]);
    } finally {
      await connection.release();
    }
  }

  async getReplay (options = {}) {
    const fromPosition = options.fromPosition || 1;
    const toPosition = options.toPosition || (2 ** 31) - 1;

    if (fromPosition > toPosition) {
      throw new Error('From position is greater than to position.');
    }

    const connection = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = connection.connection.execute(`
      SELECT event, position
        FROM ${this.namespace}_events
        WHERE position >= ?
          AND position <= ?
        ORDER BY position
      `, [ fromPosition, toPosition ]);

    let onEnd,
        onError,
        onResult;

    const unsubscribe = function () {
      connection.release();
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
      eventStream.removeListener('result', onResult);
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

    onResult = function (row) {
      const event = Event.deserialize(row.event);

      event.annotations.position = Number(row.position);
      passThrough.write(event);
    };

    eventStream.on('end', onEnd);
    eventStream.on('error', onError);
    eventStream.on('result', onResult);

    return passThrough;
  }

  async destroy () {
    if (this.pool) {
      await this.pool.end();
    }
  }
}

module.exports = Eventstore;
