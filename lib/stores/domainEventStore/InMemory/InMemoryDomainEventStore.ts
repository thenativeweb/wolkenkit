import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { errors } from '../../../common/errors';
import { last } from 'lodash';
import { omitDeepBy } from '../../../common/utils/omitDeepBy';
import { PassThrough } from 'stream';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';

class InMemoryDomainEventStore implements DomainEventStore {
  protected domainEvents: DomainEvent<DomainEventData>[];

  protected snapshots: Snapshot<State>[];

  protected constructor () {
    this.domainEvents = [];
    this.snapshots = [];
  }

  public static async create (): Promise<InMemoryDomainEventStore> {
    return new InMemoryDomainEventStore();
  }

  public async destroy (): Promise<void> {
    this.domainEvents = [];
    this.snapshots = [];
  }

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const storedDomainEvents = this.getStoredDomainEvents().filter(
      (domainEvent): boolean => domainEvent.aggregateIdentifier.id === aggregateIdentifier.id
    );

    const lastDomainEvent = last(storedDomainEvents);

    if (!lastDomainEvent) {
      return;
    }

    return lastDomainEvent as DomainEvent<TDomainEventData>;
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

    const passThrough = new PassThrough({ objectMode: true });

    const storedDomainEvents = this.getStoredDomainEvents().filter(
      (domainEvent): boolean =>
        domainEvent.aggregateIdentifier.id === aggregateIdentifier.id &&
        domainEvent.metadata.revision.aggregate >= fromRevision &&
        domainEvent.metadata.revision.aggregate <= toRevision
    );

    for (const domainEvent of storedDomainEvents) {
      passThrough.write(domainEvent);
    }

    passThrough.end();

    return passThrough;
  }

  public async getUnpublishedDomainEventStream (): Promise<PassThrough> {
    const storedDomainEvents = this.getStoredDomainEvents().filter(
      (domainEvent): boolean => !domainEvent.metadata.isPublished
    );

    const passThrough = new PassThrough({ objectMode: true });

    for (const domainEvent of storedDomainEvents) {
      passThrough.write(domainEvent);
    }

    passThrough.end();

    return passThrough;
  }

  public async saveDomainEvents <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }): Promise<DomainEvent<TDomainEventData>[]> {
    if (domainEvents.length === 0) {
      throw new Error('Domain events are missing.');
    }

    const storedDomainEvents = this.getStoredDomainEvents();
    const savedDomainEvents = [];

    for (const domainEvent of domainEvents) {
      const alreadyExists = storedDomainEvents.some(
        (eventInDatabase): boolean =>
          domainEvent.aggregateIdentifier.id === eventInDatabase.aggregateIdentifier.id &&
          domainEvent.metadata.revision.aggregate === eventInDatabase.metadata.revision.aggregate
      );

      if (alreadyExists) {
        throw new Error('Aggregate id and revision already exist.');
      }

      const savedDomainEvent = new DomainEvent<TDomainEventData>({
        ...domainEvent.withRevisionGlobal({
          revisionGlobal: storedDomainEvents.length + 1
        }),
        data: omitDeepBy(domainEvent.data, (value): boolean => value === undefined)
      });

      savedDomainEvents.push(savedDomainEvent);

      this.storeDomainEventAtDatabase({ domainEvent: savedDomainEvent });
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

    const storedDomainEvents = this.getStoredDomainEvents();

    const needsToBeMarkedAsPublished = (event: DomainEvent<DomainEventData>): boolean =>
      event.aggregateIdentifier.id === aggregateIdentifier.id &&
      event.metadata.revision.aggregate >= fromRevision &&
      event.metadata.revision.aggregate <= toRevision;

    for (const [ index, domainEvent ] of storedDomainEvents.entries()) {
      if (!needsToBeMarkedAsPublished(domainEvent)) {
        continue;
      }

      const updatedDomainEvent = domainEvent.asPublished();

      this.updateDomainEventInDatabaseAtIndex({ index, updatedDomainEvent });
    }
  }

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    const storedSnapshots = this.getStoredSnapshots().filter(
      (snapshot): boolean => snapshot.aggregateIdentifier.id === aggregateIdentifier.id
    );

    const newestSnapshotRevision = Math.max(
      ...storedSnapshots.map((snapshot): number => snapshot.revision)
    );

    const newestSnapshot = storedSnapshots.
      find((snapshot): boolean => snapshot.revision === newestSnapshotRevision);

    if (!newestSnapshot) {
      return;
    }

    return newestSnapshot as Snapshot<TState>;
  }

  public async saveSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    this.storeSnapshotAtDatabase({
      snapshot: {
        ...snapshot,
        state: omitDeepBy(snapshot.state, (value): boolean => value === undefined)
      }
    });
  }

  public async getReplay ({
    fromRevisionGlobal = 1,
    toRevisionGlobal = (2 ** 31) - 1
  }: {
    fromRevisionGlobal?: number;
    toRevisionGlobal?: number;
  }): Promise<PassThrough> {
    if (fromRevisionGlobal > toRevisionGlobal) {
      throw new Error('From revision global is greater than to revision global.');
    }

    const passThrough = new PassThrough({ objectMode: true });

    const storedDomainEvents = this.getStoredDomainEvents().filter(
      (domainEvent): boolean => {
        if (!domainEvent.metadata.revision.global) {
          throw new errors.InvalidOperation('Domain event from domain event store is missing global revision.');
        }

        return (
          domainEvent.metadata.revision.global >= fromRevisionGlobal &&
          domainEvent.metadata.revision.global <= toRevisionGlobal
        );
      }
    );

    for (const domainEvent of storedDomainEvents) {
      passThrough.write(domainEvent);
    }

    passThrough.end();

    return passThrough;
  }

  protected getStoredDomainEvents <TState extends State> (): DomainEvent<TState>[] {
    return this.domainEvents as DomainEvent<TState>[];
  }

  protected getStoredSnapshots (): Snapshot<State>[] {
    return this.snapshots;
  }

  protected storeDomainEventAtDatabase ({ domainEvent }: {
    domainEvent: DomainEvent<State>;
  }): void {
    this.domainEvents.push(domainEvent);
  }

  protected storeSnapshotAtDatabase ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): void {
    this.snapshots.push(snapshot);
  }

  protected updateDomainEventInDatabaseAtIndex ({ index, updatedDomainEvent }: {
    index: number;
    updatedDomainEvent: DomainEvent<State>;
  }): void {
    this.domainEvents[index] = updatedDomainEvent;
  }
}

export { InMemoryDomainEventStore };
