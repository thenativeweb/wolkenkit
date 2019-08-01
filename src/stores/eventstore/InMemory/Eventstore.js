'use strict';

const { PassThrough } = require('stream');

const { EventExternal, EventInternal } = require('../../../common/elements'),
      omitByDeep = require('../omitByDeep');

class Eventstore {
  async initialize () {
    this.database = {
      events: [],
      snapshots: []
    };
  }

  getStoredEvents () {
    return this.database.events;
  }

  getStoredSnapshots () {
    return this.database.snapshots;
  }

  storeEventAtDatabase (event) {
    this.database.events.push(event);
  }

  storeSnapshotAtDatabase (snapshot) {
    this.database.snapshots.push(snapshot);
  }

  updateEventInDatabaseAtIndex (index, newEventData) {
    this.database.events[index] = newEventData;
  }

  async getLastEvent ({ aggregateId }) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const eventsInDatabase = this.getStoredEvents().
      filter(event => event.aggregate.id === aggregateId);

    if (eventsInDatabase.length === 0) {
      return;
    }

    const lastEvent = eventsInDatabase[eventsInDatabase.length - 1];

    return EventExternal.fromObject(lastEvent);
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

    const filteredEvents = this.getStoredEvents().
      filter(event => event.aggregate.id === aggregateId &&
                      event.metadata.revision.aggregate >= fromRevision &&
                      event.metadata.revision.aggregate <= toRevision);

    for (const event of filteredEvents) {
      passThrough.write(EventExternal.fromObject(event));
    }

    passThrough.end();

    return passThrough;
  }

  async getUnpublishedEventStream () {
    const filteredEvents = this.getStoredEvents().
      filter(event => !event.metadata.isPublished);

    const passThrough = new PassThrough({ objectMode: true });

    for (const event of filteredEvents) {
      passThrough.write(EventExternal.fromObject(event));
    }

    passThrough.end();

    return passThrough;
  }

  async saveEvents ({ uncommittedEvents }) {
    if (!uncommittedEvents) {
      throw new Error('Uncommitted events are missing.');
    }
    if (uncommittedEvents.length === 0) {
      throw new Error('Uncommitted events are missing.');
    }

    const eventsInDatabase = this.getStoredEvents();
    const committedEvents = [];

    for (const uncommittedEvent of uncommittedEvents) {
      if (!(uncommittedEvent instanceof EventInternal)) {
        throw new Error('Event must be internal.');
      }

      const alreadyExists = eventsInDatabase.some(eventInDatabase =>
        uncommittedEvent.aggregate.id === eventInDatabase.aggregate.id &&
        uncommittedEvent.metadata.revision.aggregate === eventInDatabase.metadata.revision.aggregate);

      if (alreadyExists) {
        throw new Error('Aggregate id and revision already exist.');
      }

      const revisionGlobal = eventsInDatabase.length + 1;
      let committedEvent = uncommittedEvent.setData({
        data: omitByDeep(uncommittedEvent.data, value => value === undefined)
      });

      committedEvent = committedEvent.setRevisionGlobal({ revisionGlobal });
      committedEvents.push(committedEvent);

      this.storeEventAtDatabase(committedEvent.asExternal());
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

    const eventsFromDatabase = this.getStoredEvents();

    const shouldEventBeMarkedAsPublished = event =>
      event.aggregate.id === aggregateId &&
      event.metadata.revision.aggregate >= fromRevision &&
      event.metadata.revision.aggregate <= toRevision;

    for (const [ index, event ] of eventsFromDatabase.entries()) {
      if (shouldEventBeMarkedAsPublished(event)) {
        const eventToUpdate = event.markAsPublished();

        this.updateEventInDatabaseAtIndex(index, eventToUpdate);
      }
    }
  }

  async getSnapshot ({ aggregateId }) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const matchingSnapshotsForAggregateId = this.getStoredSnapshots().
      filter(snapshot => snapshot.aggregateId === aggregateId);

    const newestSnapshotRevision = Math.max(
      ...matchingSnapshotsForAggregateId.map(snapshot => snapshot.revision)
    );

    const matchingSnapshot = matchingSnapshotsForAggregateId.
      find(snapshot => snapshot.revision === newestSnapshotRevision);

    if (!matchingSnapshot) {
      return;
    }

    return {
      revision: matchingSnapshot.revision,
      state: matchingSnapshot.state
    };
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

    const snapshot = {
      aggregateId,
      revision,
      state: filteredState
    };

    this.storeSnapshotAtDatabase(snapshot);
  }

  async getReplay ({
    fromRevisionGlobal = 1,
    toRevisionGlobal = (2 ** 31) - 1
  } = {}) {
    if (fromRevisionGlobal > toRevisionGlobal) {
      throw new Error('From revision global is greater than to revision global.');
    }

    const passThrough = new PassThrough({ objectMode: true });

    const filteredEvents = this.getStoredEvents().
      filter(event => event.metadata.revision.global >= fromRevisionGlobal &&
                      event.metadata.revision.global <= toRevisionGlobal);

    for (const event of filteredEvents) {
      passThrough.write(EventExternal.fromObject(event));
    }

    passThrough.end();

    return passThrough;
  }

  async destroy () {
    this.database = { events: [], snapshots: []};
  }
}

module.exports = Eventstore;
