'use strict';

const { PassThrough } = require('stream');

const limitAlphanumeric = require('limit-alphanumeric'),
      { Request, TYPES } = require('tedious'),
      retry = require('async-retry');

const createPool = require('../../utils/sqlServer/createPool'),
      { EventExternal, EventInternal } = require('../../../common/elements'),
      omitByDeep = require('../omitByDeep');

class Eventstore {
  static onUnexpectedClose () {
    throw new Error('Connection closed unexpectedly.');
  }

  async getDatabase () {
    const database = await retry(async () => {
      const connection = await this.pool.acquire().promise;

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

    this.pool = createPool({
      host: hostname,
      port,
      user: username,
      password,
      database,
      encrypt: encryptConnection,

      onError (err) {
        throw err;
      },

      onDisconnect () {
        Eventstore.onUnexpectedClose();
      }
    });

    const connection = await this.getDatabase();

    const query = `
      BEGIN TRANSACTION setupTables;

      IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${this.namespace}_events')
        BEGIN
          CREATE TABLE [${this.namespace}_events] (
            [revisionGlobal] BIGINT IDENTITY(1,1),
            [aggregateId] UNIQUEIDENTIFIER NOT NULL,
            [revisionAggregate] INT NOT NULL,
            [event] NVARCHAR(4000) NOT NULL,
            [isPublished] BIT NOT NULL,

            CONSTRAINT [${this.namespace}_events_pk] PRIMARY KEY([revisionGlobal]),
            CONSTRAINT [${this.namespace}_aggregateId_revisionAggregate] UNIQUE ([aggregateId], [revisionAggregate])
          );
        END

      IF NOT EXISTS (SELECT [name] FROM sys.tables WHERE [name] = '${this.namespace}_snapshots')
        BEGIN
          CREATE TABLE [${this.namespace}_snapshots] (
            [aggregateId] UNIQUEIDENTIFIER NOT NULL,
            [revisionAggregate] INT NOT NULL,
            [state] NVARCHAR(4000) NOT NULL,

            CONSTRAINT [${this.namespace}_snapshots_pk] PRIMARY KEY([aggregateId], [revisionAggregate])
          );
        END

      COMMIT TRANSACTION setupTables;
    `;

    await new Promise((resolve, reject) => {
      const request = new Request(query, err => {
        if (err) {
          // When multiple clients initialize at the same time, e.g. during
          // integration tests, SQL Server might throw an error. In this case
          // we simply ignore it.
          if (err.message.match(/There is already an object named.*_events/u)) {
            return resolve();
          }

          return reject(err);
        }

        resolve();
      });

      connection.execSql(request);
    });

    await this.pool.release(connection);
  }

  async getLastEvent ({ aggregateId }) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const database = await this.getDatabase();

    try {
      const result = await new Promise((resolve, reject) => {
        let resultEvent;

        const request = new Request(`
          SELECT TOP(1) [event], [revisionGlobal]
            FROM ${this.namespace}_events
            WHERE [aggregateId] = @aggregateId
            ORDER BY [revisionAggregate] DESC
          ;
        `, err => {
          if (err) {
            return reject(err);
          }

          resolve(resultEvent);
        });

        request.once('row', columns => {
          resultEvent = EventExternal.fromObject(JSON.parse(columns[0].value));

          resultEvent = resultEvent.setRevisionGlobal({
            revisionGlobal: Number(columns[1].value)
          });
        });

        request.addParameter('aggregateId', TYPES.UniqueIdentifier, aggregateId);

        database.execSql(request);
      });

      if (!result) {
        return;
      }

      return result;
    } finally {
      await this.pool.release(database);
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

    const database = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });

    let onError,
        onRow,
        request;

    const unsubscribe = () => {
      this.pool.release(database);
      request.removeListener('row', onRow);
      request.removeListener('error', onError);
    };

    onError = err => {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    onRow = columns => {
      let event = EventExternal.fromObject(JSON.parse(columns[0].value));

      event = event.setRevisionGlobal({
        revisionGlobal: Number(columns[1].value)
      });

      if (columns[2].value) {
        event = event.markAsPublished();
      }

      passThrough.write(event);
    };

    request = new Request(`
      SELECT [event], [revisionAggregate], [isPublished]
        FROM [${this.namespace}_events]
        WHERE [aggregateId] = @aggregateId
          AND [revisionAggregate] >= @fromRevision
          AND [revisionAggregate] <= @toRevision
        ORDER BY [revisionAggregate]`, err => {
      unsubscribe();

      if (err) {
        passThrough.emit('error', err);
      }

      passThrough.end();
    });

    request.addParameter('aggregateId', TYPES.UniqueIdentifier, aggregateId);
    request.addParameter('fromRevision', TYPES.Int, fromRevision);
    request.addParameter('toRevision', TYPES.Int, toRevision);

    request.on('error', onError);
    request.on('row', onRow);

    database.execSql(request);

    return passThrough;
  }

  async getUnpublishedEventStream () {
    const database = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });

    let onError,
        onRow,
        request;

    const unsubscribe = () => {
      this.pool.release(database);
      request.removeListener('error', onError);
      request.removeListener('row', onRow);
    };

    onError = err => {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    onRow = columns => {
      let event = EventExternal.fromObject(JSON.parse(columns[0].value));

      event = event.setRevisionGlobal({
        revisionGlobal: Number(columns[1].value)
      });

      if (columns[2].value) {
        event = event.markAsPublished();
      }

      passThrough.write(event);
    };

    request = new Request(`
      SELECT [event], [revisionGlobal], [isPublished]
        FROM [${this.namespace}_events]
        WHERE [isPublished] = 0
        ORDER BY [revisionGlobal]
      `, err => {
      unsubscribe();

      if (err) {
        passThrough.emit('error', err);
      }

      passThrough.end();
    });

    request.on('error', onError);
    request.on('row', onRow);

    database.execSql(request);

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

    let resultCount = 0;

    for (const [ index, uncommittedEvent ] of uncommittedEvents.entries()) {
      if (!(uncommittedEvent instanceof EventInternal)) {
        throw new Error('Event must be internal.');
      }

      const rowId = index + 1;
      const row = [
        { key: `aggregateId${rowId}`, value: uncommittedEvent.aggregate.id, type: TYPES.UniqueIdentifier },
        { key: `revisionAggregate${rowId}`, value: uncommittedEvent.metadata.revision.aggregate, type: TYPES.Int },
        { key: `event${rowId}`, value: JSON.stringify(uncommittedEvent.asExternal()), type: TYPES.NVarChar, options: { length: 4000 }},
        { key: `isPublished${rowId}`, value: uncommittedEvent.metadata.isPublished, type: TYPES.Bit }
      ];

      placeholders.push(`(@${row[0].key}, @${row[1].key}, @${row[2].key}, @${row[3].key})`);

      values.push(...row);
    }

    const database = await this.getDatabase();

    const text = `
      INSERT INTO [${this.namespace}_events] ([aggregateId], [revisionAggregate], [event], [isPublished])
        OUTPUT INSERTED.[revisionGlobal]
      VALUES ${placeholders.join(',')};
    `;

    const committedEvents = [];

    try {
      await new Promise((resolve, reject) => {
        let onRow;

        const request = new Request(text, err => {
          request.removeListener('row', onRow);

          if (err) {
            return reject(err);
          }

          resolve();
        });

        for (const value of values) {
          request.addParameter(value.key, value.type, value.value, value.options);
        }

        onRow = columns => {
          const uncommittedEvent = uncommittedEvents[resultCount];
          const committedEvent = uncommittedEvent.setRevisionGlobal({
            revisionGlobal: Number(columns[0].value)
          });

          committedEvents.push(committedEvent);
          resultCount += 1;
        };

        request.on('row', onRow);

        database.execSql(request);
      });
    } catch (ex) {
      if (ex.code === 'EREQUEST' && ex.number === 2627 && ex.message.includes('_aggregateId_revisionAggregate')) {
        throw new Error('Aggregate id and revision already exist.');
      }

      throw ex;
    } finally {
      await this.pool.release(database);
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

    const database = await this.getDatabase();

    try {
      await new Promise((resolve, reject) => {
        const request = new Request(`
          UPDATE [${this.namespace}_events]
            SET [isPublished] = 1
            WHERE [aggregateId] = @aggregateId
              AND [revisionAggregate] >= @fromRevision
              AND [revisionAggregate] <= @toRevision
          `, err => {
          if (err) {
            return reject(err);
          }

          resolve();
        });

        request.addParameter('aggregateId', TYPES.UniqueIdentifier, aggregateId);
        request.addParameter('fromRevision', TYPES.Int, fromRevision);
        request.addParameter('toRevision', TYPES.Int, toRevision);

        database.execSql(request);
      });
    } finally {
      await this.pool.release(database);
    }
  }

  async getSnapshot ({ aggregateId }) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const database = await this.getDatabase();

    try {
      const result = await new Promise((resolve, reject) => {
        let resultRow;

        const request = new Request(`
          SELECT TOP(1) [state], [revisionAggregate]
            FROM ${this.namespace}_snapshots
            WHERE [aggregateId] = @aggregateId
            ORDER BY [revisionAggregate] DESC
          ;`, err => {
          if (err) {
            return reject(err);
          }

          resolve(resultRow);
        });

        request.once('row', columns => {
          resultRow = {
            state: JSON.parse(columns[0].value),
            revision: Number(columns[1].value)
          };
        });

        request.addParameter('aggregateId', TYPES.UniqueIdentifier, aggregateId);

        database.execSql(request);
      });

      if (!result) {
        return;
      }

      return result;
    } finally {
      await this.pool.release(database);
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

    const database = await this.getDatabase();

    try {
      await new Promise((resolve, reject) => {
        const request = new Request(`
          IF NOT EXISTS (SELECT TOP(1) * FROM ${this.namespace}_snapshots WHERE [aggregateId] = @aggregateId and [revisionAggregate] = @revisionAggregate)
            BEGIN
              INSERT INTO [${this.namespace}_snapshots] ([aggregateId], [revisionAggregate], [state])
              VALUES (@aggregateId, @revisionAggregate, @state);
            END
          `, err => {
          if (err) {
            return reject(err);
          }

          resolve();
        });

        request.addParameter('aggregateId', TYPES.UniqueIdentifier, aggregateId);
        request.addParameter('revisionAggregate', TYPES.Int, revision);
        request.addParameter('state', TYPES.NVarChar, JSON.stringify(filteredState), { length: 4000 });

        database.execSql(request);
      });
    } finally {
      await this.pool.release(database);
    }
  }

  async getReplay ({
    fromRevisionGlobal = 1,
    toRevisionGlobal = (2 ** 31) - 1
  } = {}) {
    if (fromRevisionGlobal > toRevisionGlobal) {
      throw new Error('From revision global is greater than to revision global.');
    }

    const database = await this.getDatabase();

    const passThrough = new PassThrough({ objectMode: true });

    let onError,
        onRow,
        request;

    const unsubscribe = () => {
      this.pool.release(database);
      request.removeListener('error', onError);
      request.removeListener('row', onRow);
    };

    onError = err => {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();
    };

    onRow = columns => {
      let event = EventExternal.fromObject(JSON.parse(columns[0].value));

      event = event.setRevisionGlobal({
        revisionGlobal: Number(columns[1].value)
      });

      passThrough.write(event);
    };

    request = new Request(`
      SELECT [event], [revisionGlobal]
        FROM [${this.namespace}_events]
        WHERE [revisionGlobal] >= @fromRevisionGlobal
          AND [revisionGlobal] <= @toRevisionGlobal
        ORDER BY [revisionGlobal]`, err => {
      unsubscribe();

      if (err) {
        passThrough.emit('error', err);
      }

      passThrough.end();
    });

    request.addParameter('fromRevisionGlobal', TYPES.BigInt, fromRevisionGlobal);
    request.addParameter('toRevisionGlobal', TYPES.BigInt, toRevisionGlobal);

    request.on('error', onError);
    request.on('row', onRow);

    database.execSql(request);

    return passThrough;
  }

  async destroy () {
    if (this.pool) {
      await this.pool.destroy();
    }
  }
}

module.exports = Eventstore;
