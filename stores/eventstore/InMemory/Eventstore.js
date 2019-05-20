'use strict';

const { PassThrough } = require('stream');

const cloneDeep = require('lodash/cloneDeep');

const { Event } = require('../../../common/elements'),
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

  async getLastEvent (aggregateId) {
    if (!aggregateId) {
      throw new Error('Aggregate id is missing.');
    }

    const eventsInDatabase = this.getStoredEvents().
      filter(event => event.aggregate.id === aggregateId);

    if (eventsInDatabase.length === 0) {
      return;
    }

    const lastEvent = eventsInDatabase[eventsInDatabase.length - 1];

    return Event.deserialize(lastEvent);
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
                      event.metadata.revision >= fromRevision &&
                      event.metadata.revision <= toRevision);

    filteredEvents.forEach(event => {
      passThrough.write(Event.deserialize(event));
    });
    passThrough.end();

    return passThrough;
  }

  async getUnpublishedEventStream () {
    const filteredEvents = this.getStoredEvents().
      filter(event => event.metadata.isPublished === false);

    const passThrough = new PassThrough({ objectMode: true });

    filteredEvents.forEach(event => {
      passThrough.write(Event.deserialize(event));
    });
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

    const committedEvents = cloneDeep(uncommittedEvents);

    const eventsInDatabase = this.getStoredEvents();

    for (const committedEvent of committedEvents) {
      if (!committedEvent.event.metadata) {
        throw new Error('Metadata are missing.');
      }
      if (committedEvent.event.metadata.revision === undefined) {
        throw new Error('Revision is missing.');
      }
      if (committedEvent.event.metadata.revision < 1) {
        throw new Error('Revision must not be less than 1.');
      }

      if (
        eventsInDatabase.find(
          eventInDatabase =>
            committedEvent.event.aggregate.id === eventInDatabase.aggregate.id &&
            committedEvent.event.metadata.revision === eventInDatabase.metadata.revision
        )
      ) {
        throw new Error('Aggregate id and revision already exist.');
      }

      const newPosition = eventsInDatabase.length + 1;

      committedEvent.event.data = omitByDeep(committedEvent.event.data, value => value === undefined);
      committedEvent.event.annotations.position = newPosition;

      this.storeEventAtDatabase(committedEvent.event);
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

    const eventsFromDatabase = this.getStoredEvents();

    const shouldEventBeMarkedAsPublished = event =>
      event.aggregate.id === aggregateId &&
      event.metadata.revision >= fromRevision &&
      event.metadata.revision <= toRevision;

    for (const [ index, event ] of eventsFromDatabase.entries()) {
      if (shouldEventBeMarkedAsPublished(event)) {
        const eventToUpdate = cloneDeep(event);

        eventToUpdate.metadata.isPublished = true;
        this.updateEventInDatabaseAtIndex(index, eventToUpdate);
      }
    }
  }

  async getSnapshot (aggregateId) {
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

  async getReplay (options = {}) {
    const fromPosition = options.fromPosition || 1;
    const toPosition = options.toPosition || (2 ** 31) - 1;

    if (fromPosition > toPosition) {
      throw new Error('From position is greater than to position.');
    }

    const passThrough = new PassThrough({ objectMode: true });

    const filteredEvents = this.getStoredEvents().
      filter(event => event.annotations.position >= fromPosition &&
                      event.annotations.position <= toPosition);

    filteredEvents.forEach(event => {
      passThrough.write(Event.deserialize(event));
    });
    passThrough.end();

    return passThrough;
  }

  async destroy () {
    this.database = { events: [], snapshots: []};
  }
}

module.exports = Eventstore;
