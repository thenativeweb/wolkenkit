import Aggregate from './Aggregate';
import AggregateApiForReadOnly from './AggregateApiForReadOnly';
import Application from '../application';
import CommandWithMetadata from '../elements/CommandWithMetadata';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import errors from '../errors';
import getAggregateService from '../services/getAggregateService';
import getClientService from '../services/getClientService';
import getLoggerService from '../services/getLoggerService';
import path from 'path';
import Repository from '../domain/Repository';
import uuid from 'uuidv4';
import Value from 'validate-value';
import { cloneDeep, get } from 'lodash';

class AggregateApiForCommands<TState> extends AggregateApiForReadOnly<TState> {
  protected readonly application: Application;

  protected readonly repository: Repository;

  protected readonly command: CommandWithMetadata<any>;

  public constructor ({ aggregate, application, repository, command }: {
    aggregate: Aggregate<TState>;
    application: Application;
    repository: Repository;
    command: CommandWithMetadata<any>;
  }) {
    super({ aggregate });

    this.application = application;
    this.repository = repository;
    this.command = command;
  }

  public publishEvent <TDomainEventData extends DomainEventData> (
    eventName: string,
    data: TDomainEventData
  ): void {
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

    const domainEvent = new DomainEvent({
      contextIdentifier: this.aggregate.contextIdentifier,
      aggregateIdentifier: this.aggregate.identifier,
      name: eventName,
      data,
      id: uuid(),
      metadata: {
        causationId: this.command.id,
        correlationId: this.command.metadata.correlationId,
        timestamp: Date.now(),
        isPublished: false,
        initiator: this.command.metadata.initiator,
        revision: {
          aggregate: this.aggregate.revision + this.aggregate.uncommittedEvents.length + 1,
          global: null
        }
      }
    });

    const previousState = cloneDeep(this.aggregate.state);
    const aggregateApiForReadOnly = new AggregateApiForReadOnly({ aggregate: this.aggregate });

    const fileName = path.join(this.application.rootDirectory, 'server', 'domain', contextName, `${this.aggregate.identifier.name}.js`);

    const services = {
      app: {
        aggregates: getAggregateService({
          application: this.application,
          repository: this.repository
        })
      },
      client: getClientService({ clientMetadata: this.command.metadata.client }),
      logger: getLoggerService({ fileName })
    };

    handle(aggregateApiForReadOnly, domainEvent, services);

    const nextState = cloneDeep(this.aggregate.state);

    const eventInternal = new DomainEventWithState({
      ...domainEvent,
      state: {
        previous: previousState,
        next: nextState
      }
    });

    this.aggregate.uncommittedEvents.push(eventInternal);
  }
}

export default AggregateApiForCommands;
