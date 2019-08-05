import Aggregate from './Aggregate';
import AggregateApiForEvents from './AggregateApiForEvents';
import AggregateApiForReadOnly from './AggregateApiForReadOnly';
import { cloneDeep } from 'lodash';
import CommandInternal from './CommandInternal';
import { Dictionary } from '../../types/Dictionary';
import errors from '../errors';
import EventExternal from './EventExternal';
import EventInternal from './EventInternal';
import { EventConfigurationInternal } from '../application/EventConfigurationInternal';
import Value from 'validate-value';

class AggregateApiForCommands extends AggregateApiForReadOnly {
  public readonly eventConfigurations: Dictionary<EventConfigurationInternal>;

  public readonly command: CommandInternal;

  public constructor ({ aggregate, eventConfigurations, command }: {
    aggregate: Aggregate;
    eventConfigurations: Dictionary<EventConfigurationInternal>;
    command: CommandInternal;
  }) {
    super({ aggregate });

    this.eventConfigurations = eventConfigurations;
    this.command = command;
  }

  public publishEvent (eventName: string, data: Dictionary<any>): void {
    const { aggregate } = this;
    const contextName = aggregate.contextIdentifier.name;

    const eventConfiguration = this.eventConfigurations[eventName];

    if (!eventConfiguration) {
      throw new errors.EventUnknown(`Failed to publish unknown event '${eventName}' in '${contextName}.${aggregate.identifier.name}'.`);
    }

    const { handle, schema } = eventConfiguration;

    if (schema) {
      const value = new Value(schema);

      value.validate(data, { valueName: 'data', separator: '.' });
    }

    const eventExternal = EventExternal.create({
      contextIdentifier: aggregate.contextIdentifier,
      aggregateIdentifier: aggregate.identifier,
      name: eventName,
      data,
      metadata: {
        initiator: this.command.annotations.initiator,
        correlationId: this.command.metadata.correlationId,
        causationId: this.command.id,
        revision: {
          aggregate: aggregate.revision + aggregate.uncommittedEvents.length + 1
        }
      }
    });

    const previousState = cloneDeep(aggregate.state);
    const aggregateApiForEvents = new AggregateApiForEvents({ aggregate });

    handle(aggregateApiForEvents, eventExternal, ??); // TODO

    const state = cloneDeep(aggregate.state);

    const eventInternal = EventInternal.deserialize({
      ...eventExternal,
      annotations: {
        previousState,
        state
      }
    });

    aggregate.uncommittedEvents.push(eventInternal);
  }
}

export default AggregateApiForCommands;
