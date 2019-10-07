import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import errors from '../../../common/errors';
import EventExternal from '../../../common/elements/EventExternal';
import EventInternal from '../../../common/elements/EventInternal';
import { Eventstore } from '../Eventstore';
import omitByDeep from '../../../common/utils/omitByDeep';
import { PassThrough } from 'stream';
import { Snapshot } from '../Snapshot';

class InMemoryEventstore implements Eventstore {
  protected database: {
    events: EventExternal[];
    snapshots: Snapshot[];
  };

  public constructor () {
    this.database = {
      events: [],
      snapshots: []
    };
  }

  /* eslint-disable class-methods-use-this */
  public async create (): Promise<void> {
    // Intentionally left blank.
  }
  /* eslint-enable class-methods-use-this */

  public async destroy (): Promise<void> {
    this.database = { events: [], snapshots: []};
  }

  public async getLastEvent ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<EventExternal | undefined> {
    const eventsInDatabase = this.getStoredEvents().
      filter((event: EventExternal): boolean => event.aggregateIdentifier.id === aggregateIdentifier.id);

    if (eventsInDatabase.length === 0) {
      return;
    }

    const lastEvent = eventsInDatabase[eventsInDatabase.length - 1];

    return lastEvent;
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

    const passThrough = new PassThrough({ objectMode: true });

    const filteredEvents = this.getStoredEvents().
      filter((event: EventExternal): boolean =>
        event.aggregateIdentifier.id === aggregateIdentifier.id &&
        event.metadata.revision.aggregate >= fromRevision &&
        event.metadata.revision.aggregate <= toRevision);

    for (const event of filteredEvents) {
      passThrough.write(event);
    }

    passThrough.end();

    return passThrough;
  }

  public async getUnpublishedEventStream (): Promise<PassThrough> {
    const filteredEvents = this.getStoredEvents().
      filter((event: EventExternal): boolean => !event.metadata.isPublished);

    const passThrough = new PassThrough({ objectMode: true });

    for (const event of filteredEvents) {
      passThrough.write(event);
    }

    passThrough.end();

    return passThrough;
  }

  public async saveEvents ({ uncommittedEvents }: {
    uncommittedEvents: EventInternal[];
  }): Promise<EventInternal[]> {
    if (uncommittedEvents.length === 0) {
      throw new Error('Uncommitted events are missing.');
    }

    const eventsInDatabase = this.getStoredEvents();
    const committedEvents = [];

    for (const uncommittedEvent of uncommittedEvents) {
      const alreadyExists = eventsInDatabase.some((eventInDatabase: EventExternal): boolean =>
        uncommittedEvent.aggregateIdentifier.id === eventInDatabase.aggregateIdentifier.id &&
        uncommittedEvent.metadata.revision.aggregate === eventInDatabase.metadata.revision.aggregate);

      if (alreadyExists) {
        throw new Error('Aggregate id and revision already exist.');
      }

      const revisionGlobal = eventsInDatabase.length + 1;
      let committedEvent = uncommittedEvent.setData({
        data: omitByDeep(
          uncommittedEvent.data,
          (value: any): boolean => value === undefined
        )
      });

      committedEvent = committedEvent.setRevisionGlobal({ revisionGlobal });
      committedEvents.push(committedEvent);

      this.storeEventAtDatabase(committedEvent.asExternal());
    }

    const indexForSnapshot = committedEvents.findIndex(
      (committedEvent: EventInternal): boolean => committedEvent.metadata.revision.aggregate % 100 === 0
    );

    if (indexForSnapshot !== -1) {
      const { aggregateIdentifier } = committedEvents[indexForSnapshot];
      const { aggregate: revisionAggregate } = committedEvents[indexForSnapshot].metadata.revision;
      const { state } = committedEvents[indexForSnapshot].annotations;

      await this.saveSnapshot({ snapshot: { aggregateIdentifier, revision: revisionAggregate, state }});
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

    const eventsFromDatabase = this.getStoredEvents();

    const shouldEventBeMarkedAsPublished = (event: EventExternal): boolean =>
      event.aggregateIdentifier.id === aggregateIdentifier.id &&
      event.metadata.revision.aggregate >= fromRevision &&
      event.metadata.revision.aggregate <= toRevision;

    for (const [ index, event ] of eventsFromDatabase.entries()) {
      if (shouldEventBeMarkedAsPublished(event)) {
        const eventToUpdate = event.markAsPublished();

        this.updateEventInDatabaseAtIndex(index, eventToUpdate);
      }
    }
  }

  public async getSnapshot ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot | undefined> {
    const matchingSnapshotsForAggregateId = this.getStoredSnapshots().
      filter((snapshot: Snapshot): boolean => snapshot.aggregateIdentifier.id === aggregateIdentifier.id);

    const newestSnapshotRevision = Math.max(
      ...matchingSnapshotsForAggregateId.map((snapshot: Snapshot): number => snapshot.revision)
    );

    const matchingSnapshot = matchingSnapshotsForAggregateId.
      find((snapshot: Snapshot): boolean => snapshot.revision === newestSnapshotRevision);

    if (!matchingSnapshot) {
      return;
    }

    return matchingSnapshot;
  }

  public async saveSnapshot ({ snapshot }: {
    snapshot: Snapshot;
  }): Promise<void> {
    const filteredState = omitByDeep(snapshot.state, (value: any): boolean => value === undefined);
    const filteredSnapshot = { ...snapshot, astate: filteredState };

    this.storeSnapshotAtDatabase(filteredSnapshot);
  }

  public async getReplay ({
    fromRevisionGlobal = 1,
    toRevisionGlobal = (2 ** 31) - 1
  }: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
  } = {}): Promise<PassThrough> {
    if (fromRevisionGlobal > toRevisionGlobal) {
      throw new Error('From revision global is greater than to revision global.');
    }

    const passThrough = new PassThrough({ objectMode: true });

    const filteredEvents = this.getStoredEvents().
      filter((event: EventExternal): boolean => {
        if (!event.metadata.revision.global) {
          throw new errors.InvalidOperation('Event from event store is missing global revision.');
        }

        return (
          event.metadata.revision.global >= fromRevisionGlobal &&
          event.metadata.revision.global <= toRevisionGlobal
        );
      });

    for (const event of filteredEvents) {
      passThrough.write(event);
    }

    passThrough.end();

    return passThrough;
  }

  protected getStoredEvents (): EventExternal[] {
    return this.database.events;
  }

  protected getStoredSnapshots (): Snapshot[] {
    return this.database.snapshots;
  }

  protected storeEventAtDatabase (event: EventExternal): void {
    this.database.events.push(event);
  }

  protected storeSnapshotAtDatabase (snapshot: Snapshot): void {
    this.database.snapshots.push(snapshot);
  }

  protected updateEventInDatabaseAtIndex (index: number, newEventData: EventExternal): void {
    this.database.events[index] = newEventData;
  }
}

export default InMemoryEventstore;
