import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { ContextIdentifier } from '../elements/ContextIdentifier';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { errors } from '../errors';
import { get } from 'lodash';
import { Readable } from 'stream';
import { Snapshot } from '../../stores/eventstore/Snapshot';
import { State } from '../elements/State';

class Aggregate<TState extends State> {
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

    this.state = initialState;
    this.revision = 0;
    this.uncommittedEvents = [];
  }

  public exists (): boolean {
    return this.revision > 0;
  }

  public applySnapshot ({ snapshot }: {
    snapshot: Snapshot<TState>;
  }): void {
    if (this.identifier.id !== snapshot.aggregateIdentifier.id) {
      throw new errors.IdentifierMismatch(`Failed to apply snapshot '${snapshot.aggregateIdentifier.name}.${snapshot.aggregateIdentifier.id}' to aggregate '${this.contextIdentifier.name}.${this.identifier.name}'.`);
    }

    this.state = snapshot.state;
    this.revision = snapshot.revision;
  }

  public async applyEventStream ({ applicationDefinition, eventStream }: {
    applicationDefinition: ApplicationDefinition;
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
        !get(applicationDefinition, `events.internal.${this.contextIdentifier.name}.${this.identifier.name}.${event.name}`)
      ) {
        throw new errors.DomainEventUnknown(`Failed to apply unknown domain event '${event.name}' in '${this.contextIdentifier.name}.${this.identifier.name}'.`);
      }

      const { handle } = get(applicationDefinition, `events.internal.${this.contextIdentifier.name}.${this.identifier.name}.${event.name}`);

      handle(event);

      this.revision = event.metadata.revision.aggregate;
    }
  }
}

export { Aggregate };
