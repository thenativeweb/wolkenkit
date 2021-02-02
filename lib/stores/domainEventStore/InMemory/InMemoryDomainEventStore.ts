import { AggregateIdentifier } from '../../../common/elements/AggregateIdentifier';
import { DomainEvent } from '../../../common/elements/DomainEvent';
import { DomainEventData } from '../../../common/elements/DomainEventData';
import { DomainEventStore } from '../DomainEventStore';
import { errors } from '../../../common/errors';
import { InMemoryDomainEventStoreOptions } from './InMemoryDomainEventStoreOptions';
import { last } from 'lodash';
import { omitDeepBy } from '../../../common/utils/omitDeepBy';
import { Snapshot } from '../Snapshot';
import { State } from '../../../common/elements/State';
import { PassThrough, Readable } from 'stream';

class InMemoryDomainEventStore implements DomainEventStore {
  protected domainEvents: DomainEvent<DomainEventData>[];

  protected snapshots: Snapshot<State>[];

  protected constructor () {
    this.domainEvents = [];
    this.snapshots = [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static async create (options: InMemoryDomainEventStoreOptions): Promise<InMemoryDomainEventStore> {
    return new InMemoryDomainEventStore();
  }

  public async getLastDomainEvent <TDomainEventData extends DomainEventData> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<DomainEvent<TDomainEventData> | undefined> {
    const storedDomainEvents = this.getStoredDomainEvents().filter(
      (domainEvent): boolean => domainEvent.aggregateIdentifier.aggregate.id === aggregateIdentifier.aggregate.id
    );

    const lastDomainEvent = last(storedDomainEvents);

    if (!lastDomainEvent) {
      return;
    }

    return lastDomainEvent as DomainEvent<TDomainEventData>;
  }

  public async getDomainEventsByCausationId ({ causationId }: {
    causationId: string;
  }): Promise<Readable> {
    return Readable.from(
      this.getStoredDomainEvents().
        filter((domainEvent): boolean => domainEvent.metadata.causationId === causationId)
    );
  }

  public async hasDomainEventsWithCausationId ({ causationId }: {
    causationId: string;
  }): Promise<boolean> {
    return this.getStoredDomainEvents().
      some((domainEvent): boolean => domainEvent.metadata.causationId === causationId);
  }

  public async getDomainEventsByCorrelationId ({ correlationId }: {
    correlationId: string;
  }): Promise<Readable> {
    return Readable.from(
      this.getStoredDomainEvents().
        filter((domainEvent): boolean => domainEvent.metadata.correlationId === correlationId)
    );
  }

  public async getReplay ({
    fromTimestamp = 0
  }: {
    fromTimestamp?: number;
  }): Promise<Readable> {
    if (fromTimestamp < 0) {
      throw new errors.ParameterInvalid(`Parameter 'fromTimestamp' must be at least 0.`);
    }

    const passThrough = new PassThrough({ objectMode: true });

    const storedDomainEvents = this.getStoredDomainEvents().filter(
      (domainEvent): boolean => domainEvent.metadata.timestamp >= fromTimestamp
    );

    for (const domainEvent of storedDomainEvents) {
      passThrough.write(domainEvent);
    }

    passThrough.end();

    return passThrough;
  }

  public async getReplayForAggregate ({
    aggregateId,
    fromRevision = 1,
    toRevision = (2 ** 31) - 1
  }: {
    aggregateId: string;
    fromRevision?: number;
    toRevision?: number;
  }): Promise<Readable> {
    if (fromRevision < 1) {
      throw new errors.ParameterInvalid(`Parameter 'fromRevision' must be at least 1.`);
    }
    if (toRevision < 1) {
      throw new errors.ParameterInvalid(`Parameter 'toRevision' must be at least 1.`);
    }
    if (fromRevision > toRevision) {
      throw new errors.ParameterInvalid(`Parameter 'toRevision' must be greater or equal to 'fromRevision'.`);
    }

    const passThrough = new PassThrough({ objectMode: true });

    const storedDomainEvents = this.getStoredDomainEvents().filter(
      (domainEvent): boolean =>
        domainEvent.aggregateIdentifier.aggregate.id === aggregateId &&
        domainEvent.metadata.revision >= fromRevision &&
        domainEvent.metadata.revision <= toRevision
    );

    for (const domainEvent of storedDomainEvents) {
      passThrough.write(domainEvent);
    }

    passThrough.end();

    return passThrough;
  }

  public async getSnapshot <TState extends State> ({ aggregateIdentifier }: {
    aggregateIdentifier: AggregateIdentifier;
  }): Promise<Snapshot<TState> | undefined> {
    const storedSnapshots = this.getStoredSnapshots().filter(
      (snapshot): boolean => snapshot.aggregateIdentifier.aggregate.id === aggregateIdentifier.aggregate.id
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

  public async storeDomainEvents <TDomainEventData extends DomainEventData> ({ domainEvents }: {
    domainEvents: DomainEvent<TDomainEventData>[];
  }): Promise<void> {
    if (domainEvents.length === 0) {
      throw new errors.ParameterInvalid('Domain events are missing.');
    }

    const storedDomainEvents = this.getStoredDomainEvents();

    for (const domainEvent of domainEvents) {
      const alreadyExists = storedDomainEvents.some(
        (eventInDatabase): boolean =>
          domainEvent.aggregateIdentifier.aggregate.id === eventInDatabase.aggregateIdentifier.aggregate.id &&
          domainEvent.metadata.revision === eventInDatabase.metadata.revision
      );

      if (alreadyExists) {
        throw new errors.RevisionAlreadyExists('Aggregate id and revision already exist.');
      }

      const savedDomainEvent = new DomainEvent<TDomainEventData>({
        ...domainEvent,
        data: omitDeepBy(domainEvent.data, (value): boolean => value === undefined)
      });

      this.storeDomainEventAtDatabase({ domainEvent: savedDomainEvent });
    }
  }

  public async storeSnapshot ({ snapshot }: {
    snapshot: Snapshot<State>;
  }): Promise<void> {
    this.storeSnapshotAtDatabase({
      snapshot: {
        ...snapshot,
        state: omitDeepBy(snapshot.state, (value): boolean => value === undefined)
      }
    });
  }

  public async getAggregateIdentifiers (): Promise<Readable> {
    const aggregateIdentifiers: Map<string, AggregateIdentifier> = new Map();

    for (const domainEvent of this.getStoredDomainEvents()) {
      aggregateIdentifiers.set(domainEvent.aggregateIdentifier.aggregate.id, domainEvent.aggregateIdentifier);
    }

    return Readable.from(aggregateIdentifiers.values());
  }

  public async getAggregateIdentifiersByName ({ contextName, aggregateName }: {
    contextName: string;
    aggregateName: string;
  }): Promise<Readable> {
    const aggregateIdentifiers: Map<string, AggregateIdentifier> = new Map();

    for (const domainEvent of this.getStoredDomainEvents()) {
      if (
        domainEvent.aggregateIdentifier.context.name === contextName &&
          domainEvent.aggregateIdentifier.aggregate.name === aggregateName
      ) {
        aggregateIdentifiers.set(domainEvent.aggregateIdentifier.aggregate.id, domainEvent.aggregateIdentifier);
      }
    }

    return Readable.from(aggregateIdentifiers.values());
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

  // eslint-disable-next-line class-methods-use-this
  public async setup (): Promise<void> {
    // There is nothing to do here.
  }

  public async destroy (): Promise<void> {
    this.domainEvents = [];
    this.snapshots = [];
  }
}

export { InMemoryDomainEventStore };
