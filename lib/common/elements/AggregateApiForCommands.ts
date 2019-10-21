import Aggregate from './Aggregate';
import AggregateApiForEvents from './AggregateApiForEvents';
import AggregateApiForReadOnly from './AggregateApiForReadOnly';
import Application from '../application';
import CommandInternal from './CommandInternal';
import { Dictionary } from '../../types/Dictionary';
import errors from '../errors';
import EventExternal from './EventExternal';
import EventInternal from './EventInternal';
import getAggregateService from '../services/getAggregateService';
import getClientService from '../services/getClientService';
import getLoggerService from '../services/getLoggerService';
import path from 'path';
import Repository from '../domain/Repository';
import Value from 'validate-value';
import { cloneDeep, get } from 'lodash';

class AggregateApiForCommands extends AggregateApiForReadOnly {
  public readonly application: Application;

  public readonly repository: Repository;

  public readonly command: CommandInternal;

  public constructor ({ aggregate, application, repository, command }: {
    aggregate: Aggregate;
    application: Application;
    repository: Repository;
    command: CommandInternal;
  }) {
    super({ aggregate });

    this.application = application;
    this.repository = repository;
    this.command = command;
  }

  public publishEvent (eventName: string, data: Dictionary<any> = {}): void {
    const contextName = this.aggregate.contextIdentifier.name;

    const eventConfiguration = get(this.application, `events.internal.${contextName}.${this.aggregate.identifier.name}.${eventName}`);

    if (!eventConfiguration) {
      throw new errors.EventUnknown(`Failed to publish unknown event '${eventName}' in '${contextName}.${this.aggregate.identifier.name}'.`);
    }

    const { handle, schema } = eventConfiguration;

    if (schema) {
      const value = new Value(schema);

      value.validate(data, { valueName: 'data', separator: '.' });
    }

    const eventExternal = EventExternal.create({
      contextIdentifier: this.aggregate.contextIdentifier,
      aggregateIdentifier: this.aggregate.identifier,
      name: eventName,
      data,
      metadata: {
        initiator: this.command.annotations.initiator,
        correlationId: this.command.metadata.correlationId,
        causationId: this.command.id,
        revision: {
          aggregate: this.aggregate.revision + this.aggregate.uncommittedEvents.length + 1
        }
      }
    });

    const previousState = cloneDeep(this.aggregate.state);
    const aggregateApiForEvents = new AggregateApiForEvents({ aggregate: this.aggregate });

    const fileName = path.join(this.application.rootDirectory, 'server', 'domain', contextName, `${this.aggregate.identifier.name}.js`);

    const services = {
      app: {
        aggregates: getAggregateService({
          application: this.application,
          repository: this.repository
        })
      },
      client: getClientService({ clientMetadata: this.command.annotations.client }),
      logger: getLoggerService({ fileName })
    };

    handle(aggregateApiForEvents, eventExternal, services);

    const state = cloneDeep(this.aggregate.state);

    const eventInternal = EventInternal.deserialize({
      ...eventExternal,
      annotations: {
        previousState,
        state
      }
    });

    this.aggregate.uncommittedEvents.push(eventInternal);
  }
}

export default AggregateApiForCommands;
