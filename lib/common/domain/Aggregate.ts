import AggregateApiForReadOnly from './AggregateApiForReadOnly';
import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import Application from '../application';
import { ContextIdentifier } from '../elements/ContextIdentifier';
import DomainEvent from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import DomainEventWithState from '../elements/DomainEventWithState';
import errors from '../errors';
import { Readable } from 'stream';
import { Snapshot } from '../../stores/eventstore/Snapshot';
import { cloneDeep, get } from 'lodash';

class Aggregate<TState> {
  public readonly contextIdentifier: ContextIdentifier;

  public readonly identifier: AggregateIdentifier;

  public state: TState;

  public revision: number;

  public uncommittedEvents: DomainEventWithState<DomainEventData, TState>[];

  public constructor ({ contextIdentifier, aggregateIdentifier, initialState }: {
    contextIdentifier: ContextIdentifier;
    aggregateIdentifier: AggregateIdentifier;
    initialState: TState;
  }) {
    this.contextIdentifier = contextIdentifier;
    this.identifier = aggregateIdentifier;

    this.state = cloneDeep(initialState);
    this.revision = 0;
    this.uncommittedEvents = [];
  }

  public exists (): boolean {
    return this.revision > 0;
  }

  public applySnapshot ({ snapshot }: {
    snapshot: Snapshot;
  }): void {
    if (this.identifier.id !== snapshot.aggregateIdentifier.id) {
      throw new errors.IdentifierMismatch(`Failed to apply snapshot '${snapshot.aggregateIdentifier.name}.${snapshot.aggregateIdentifier.id}' to aggregate '${this.contextIdentifier.name}.${this.identifier.name}'.`);
    }

    this.state = snapshot.state;
    this.revision = snapshot.revision;
  }

  public async applyEventStream ({ application, eventStream }: {
    application: Application;
    eventStream: Readable;
  }): Promise<void> {
    for await (const event of eventStream) {
      if (!(event instanceof DomainEvent)) {
        throw new errors.TypeInvalid('Entity in event stream has an invalid type.');
      }

      if (event.contextIdentifier.name !== this.contextIdentifier.name) {
        throw new errors.IdentifierMismatch('Context name does not match.');
      }
      if (event.aggregateIdentifier.name !== this.identifier.name) {
        throw new errors.IdentifierMismatch('Aggregate name does not match.');
      }
      if (event.aggregateIdentifier.id !== this.identifier.id) {
        throw new errors.IdentifierMismatch('Aggregate id does not match.');
      }

      if (
        !get(application, `events.internal.${this.contextIdentifier.name}.${this.identifier.name}.${event.name}`)
      ) {
        throw new errors.EventUnknown(`Failed to apply unknown event '${event.name}' in '${this.contextIdentifier.name}.${this.identifier.name}'.`);
      }

      const { handle } = get(application, `events.internal.${this.contextIdentifier.name}.${this.identifier.name}.${event.name}`);
      const aggregateApiForEvents = new AggregateApiForReadOnly({ aggregate: this });

      handle(aggregateApiForEvents, event);

      this.revision = event.metadata.revision.aggregate;
    }
  }
}

export default Aggregate;
