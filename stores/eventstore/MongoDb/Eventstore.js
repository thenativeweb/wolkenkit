'use strict';

const { parse } = require('url'),
      { PassThrough } = require('stream');

const limitAlphanumeric = require('limit-alphanumeric'),
      { MongoClient } = require('mongodb'),
      retry = require('async-retry');

const { EventExternal, EventInternal } = require('../../../common/elements'),
      omitByDeep = require('../omitByDeep');

class Eventstore {
  constructor () {
    this.client = undefined;
    this.db = undefined;
    this.collections = {};
  }

  static onUnexpectedClose () {
    throw new Error('Connection closed unexpectedly.');
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

    const url = `mongodb://${username}:${password}@${hostname}:${port}/${database}`;

    /* eslint-disable id-length */
    this.client = await retry(async () => {
      const connection = await MongoClient.connect(url, { w: 1, useNewUrlParser: true });

      return connection;
    });
    /* eslint-enable id-length */

    const databaseName = parse(url).pathname.substring(1);

    this.db = this.client.db(databaseName);
    this.db.on('close', Eventstore.onUnexpectedClose);

    this.collections.events = this.db.collection(`${namespace}_events`);
    this.collections.snapshots = this.db.collection(`${namespace}_snapshots`);
    this.collections.counters = this.db.collection(`${namespace}_counters`);

    await this.collections.events.createIndexes([
      {
        key: { 'aggregate.id': 1 },
        name: `${this.namespace}_aggregateId`
      },
      {
        key: { 'aggregate.id': 1, 'metadata.revision.aggregate': 1 },
        name: `${this.namespace}_aggregateId_revisionAggregate`,
        unique: true
      },
      {
        key: { 'metadata.revision.global': 1 },
        name: `${this.namespace}_revisionGlobal`,
        unique: true
      }
    ]);
    await this.collections.snapshots.createIndexes([
      {
        key: { aggregateId: 1 },
        unique: true
      }
    ]);

    try {
      await this.collections.counters.insertOne({ _id: 'events', seq: 0 });
    } catch (ex) {
      if (ex.code === 11000 && ex.message.includes('_counters index: _id_ dup key')) {
        return;
      }

      throw ex;
    }
  }

  async getNextSequence ({ name }) {
    if (!name) {
      throw new Error('Name is missing.');
    }

    const counter = await this.collections.counters.findOneAndUpdate({ _id: name }, {
      $inc: { seq: 1 }
    }, { returnOriginal: false });

    return counter.value.seq;
  }

  async getLastEvent ({ aggregateId }) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const events = await this.collections.events.find({
      'aggregate.id': aggregateId
    }, {
      projection: { _id: 0 },
      sort: { 'metadata.revision.aggregate': -1 },
      limit: 1
    }).toArray();

    if (events.length === 0) {
      return;
    }

    return EventExternal.fromObject(events[0]);
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

    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = this.collections.events.find({
      $and: [
        { 'aggregate.id': aggregateId },
        { 'metadata.revision.aggregate': { $gte: fromRevision }},
        { 'metadata.revision.aggregate': { $lte: toRevision }}
      ]
    }, {
      projection: { _id: 0 },
      sort: 'metadata.revision.aggregate'
    }).stream();

    let onData,
        onEnd,
        onError;

    const unsubscribe = function () {
      eventStream.removeListener('data', onData);
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
    };

    onData = function (data) {
      passThrough.write(EventExternal.fromObject(data));
    };

    onEnd = function () {
      unsubscribe();
      passThrough.end();

      // In the PostgreSQL eventstore, we call eventStream.end() here. In MongoDB,
      // this function apparently is not implemented. This note is just for
      // informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    onError = function (err) {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();

      // In the PostgreSQL eventstore, we call eventStream.end() here. In MongoDB,
      // this function apparently is not implemented. This note is just for
      // informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    eventStream.on('data', onData);
    eventStream.on('end', onEnd);
    eventStream.on('error', onError);

    return passThrough;
  }

  async getUnpublishedEventStream () {
    const passThrough = new PassThrough({ objectMode: true });
    const eventStream = this.collections.events.find({
      'metadata.isPublished': false
    }, {
      projection: { _id: 0 },
      sort: 'metadata.revision.global'
    }).stream();

    let onData,
        onEnd,
        onError;

    const unsubscribe = function () {
      eventStream.removeListener('data', onData);
      eventStream.removeListener('end', onEnd);
      eventStream.removeListener('error', onError);
    };

    onData = function (data) {
      passThrough.write(EventExternal.fromObject(data));
    };

    onEnd = function () {
      unsubscribe();
      passThrough.end();

      // In the PostgreSQL eventstore, we call eventStream.end() here. In MongoDB,
      // this function apparently is not implemented. This note is just for
      // informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    onError = function (err) {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();

      // In the PostgreSQL eventstore, we call eventStream.end() here. In MongoDB,
      // this function apparently is not implemented. This note is just for
      // informational purposes to ensure that you are aware that the two
      // implementations differ here.
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

    const committedEvents = [];

    try {
      for (const uncommittedEvent of uncommittedEvents) {
        if (!(uncommittedEvent instanceof EventInternal)) {
          throw new Error('Event must be internal.');
        }

        const revisionGlobal = await this.getNextSequence({ name: 'events' });

        let committedEvent = uncommittedEvent.setData({
          data: omitByDeep(uncommittedEvent.data, value => value === undefined)
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

    await this.collections.events.updateMany({
      'aggregate.id': aggregateId,
      'metadata.revision.aggregate': {
        $gte: fromRevision,
        $lte: toRevision
      }
    }, {
      $set: {
        'metadata.isPublished': true
      }
    }, {
      multi: true
    });
  }

  async getSnapshot ({ aggregateId }) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const snapshot = await this.collections.snapshots.findOne(
      { aggregateId },
      { projection: { _id: false, revisionAggregate: true, state: true }}
    );

    if (!snapshot) {
      return;
    }

    const mappedSnapshot = {
      revision: snapshot.revisionAggregate,
      state: snapshot.state
    };

    return mappedSnapshot;
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

    await this.collections.snapshots.updateOne(
      { aggregateId },
      { $set: { aggregateId, state: filteredState, revisionAggregate: revision }},
      { upsert: true }
    );
  }

  async getReplay ({
    fromRevisionGlobal = 1,
    toRevisionGlobal = (2 ** 31) - 1
  } = {}) {
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
      sort: 'metadata.revision.global'
    }).stream();

    let onData,
        onEnd,
        onError;

    const unsubscribe = function () {
      replayStream.removeListener('data', onData);
      replayStream.removeListener('end', onEnd);
      replayStream.removeListener('error', onError);
    };

    onData = function (data) {
      passThrough.write(EventExternal.fromObject(data));
    };

    onEnd = function () {
      unsubscribe();
      passThrough.end();

      // In the PostgreSQL eventstore, we call replayStream.end() here. In MongoDB,
      // this function apparently is not implemented. This note is just for
      // informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    onError = function (err) {
      unsubscribe();
      passThrough.emit('error', err);
      passThrough.end();

      // In the PostgreSQL eventstore, we call replayStream.end() here. In MongoDB,
      // this function apparently is not implemented. This note is just for
      // informational purposes to ensure that you are aware that the two
      // implementations differ here.
    };

    replayStream.on('data', onData);
    replayStream.on('end', onEnd);
    replayStream.on('error', onError);

    return passThrough;
  }

  async destroy () {
    if (this.db) {
      this.db.removeListener('close', Eventstore.onUnexpectedClose);
    }
    if (this.client) {
      await this.client.close(true);
    }
  }
}

module.exports = Eventstore;
