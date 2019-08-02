import AggregateApiForEvents from './AggregateApiForEvents';
import Application from '../application';
import errors from '../errors';
import EventExternal from './EventExternal';
import EventInternal from './EventInternal';
import { IAggregateIdentifier } from './types/IAggregateIdentifier';
import { IContextIdentifier } from './types/IContextIdentifier';
import { ISnapshot } from '../../stores/eventstore/types/ISnapshot';
import { Readable } from 'stream';
import { State } from './types/State';
import { cloneDeep, get } from 'lodash';

class Aggregate {
  public readonly contextIdentifier: IContextIdentifier;

  public readonly name: string;

  public readonly id: string;

  public state: State;

  public revision: number;

  public uncommittedEvents: EventInternal[];

  public constructor ({ contextIdentifier, aggregateIdentifier, initialState }: {
    contextIdentifier: IContextIdentifier;
    aggregateIdentifier: IAggregateIdentifier;
    initialState: State;
  }) {
    this.contextIdentifier = contextIdentifier;
    this.name = aggregateIdentifier.name;
    this.id = aggregateIdentifier.id;

    this.state = cloneDeep(initialState);
    this.revision = 0;
    this.uncommittedEvents = [];
  }

  public exists (): boolean {
    return this.revision > 0;
  }

  public applySnapshot ({ snapshot }: {
    snapshot: ISnapshot;
  }): void {
    this.state = snapshot.state;
    this.revision = snapshot.revision;
  }

  public async applyEventStream ({ application, eventStream }: {
    application: Application;
    eventStream: Readable;
  }): Promise<void> {
    for await (const event of eventStream) {
      if (!(event instanceof EventExternal)) {
        throw new errors.TypeInvalid('Entity in event stream has an invalid type.');
      }

      if (event.contextIdentifier.name !== this.contextIdentifier.name) {
        throw new errors.IdentifierMismatch('Context name does not match.');
      }
      if (event.aggregateIdentifier.name !== this.name) {
        throw new errors.IdentifierMismatch('Aggregate name does not match.');
      }
      if (event.aggregateIdentifier.id !== this.id) {
        throw new errors.IdentifierMismatch('Aggregate id does not match.');
      }

      if (
        !get(application, `events.internal.${this.contextIdentifier.name}.${this.name}.${event.name}`)
      ) {
        throw new errors.EventUnknown(`Failed to apply unknown event '${event.name}' in '${this.contextIdentifier.name}.${this.name}'.`);
      }

      const { handle } = get(application, `events.internal.${this.contextIdentifier.name}.${this.name}.${event.name}`);
      const aggregateApiForEvents = new AggregateApiForEvents({ aggregate: this });

      handle(aggregateApiForEvents, event);

      this.revision = event.metadata.revision.aggregate;
    }
  }
}

export default Aggregate;
