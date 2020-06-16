import { AggregateInstance } from '../domain/AggregateInstance';
import { AggregateService } from './AggregateService';
import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventHandler } from '../elements/DomainEventHandler';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { errors } from '../errors';
import { GetAggregateService } from './types/GetAggregateService';
import { State } from '../elements/State';
import { uuid } from 'uuidv4';
import { Value } from 'validate-value';
import { cloneDeep, get } from 'lodash';

const getAggregateService: GetAggregateService = function <TState extends State> ({ aggregateInstance, applicationDefinition, command }: {
  aggregateInstance: AggregateInstance<TState>;
  applicationDefinition: ApplicationDefinition;
  command: CommandWithMetadata<any>;
}): AggregateService<TState> {
  return {
    id (): string {
      return aggregateInstance.aggregateIdentifier.id;
    },

    isPristine (): boolean {
      return aggregateInstance.isPristine();
    },

    publishDomainEvent <TDomainEventData extends DomainEventData> (
      domainEventName: string,
      data: TDomainEventData,
      metadata: { tags: string[] } = { tags: []}
    ): TState {
      const contextName = aggregateInstance.contextIdentifier.name;
      const aggregateName = aggregateInstance.aggregateIdentifier.name;

      const domainEventHandler = get(applicationDefinition.domain, [ contextName, aggregateName, 'domainEventHandlers', domainEventName ]) as DomainEventHandler<State, DomainEventData> | undefined;

      if (!domainEventHandler) {
        throw new errors.DomainEventUnknown(`Failed to publish unknown domain event '${domainEventName}' in '${contextName}.${aggregateName}'.`);
      }

      if (domainEventHandler.getSchema) {
        const schema = domainEventHandler.getSchema();
        const value = new Value(schema);

        value.validate(data, { valueName: 'data', separator: '.' });
      }

      const domainEvent = new DomainEvent({
        contextIdentifier: aggregateInstance.contextIdentifier,
        aggregateIdentifier: aggregateInstance.aggregateIdentifier,
        name: domainEventName,
        data,
        id: uuid(),
        metadata: {
          causationId: command.id,
          correlationId: command.metadata.correlationId,
          timestamp: Date.now(),
          initiator: command.metadata.initiator,
          revision: aggregateInstance.revision + aggregateInstance.unstoredDomainEvents.length + 1,
          tags: metadata.tags
        }
      });

      const previousState = cloneDeep(aggregateInstance.state);
      const nextState = aggregateInstance.applyDomainEvent({ applicationDefinition, domainEvent });

      const domainEventWithState = new DomainEventWithState({
        ...domainEvent,
        state: {
          previous: previousState,
          next: nextState
        }
      });

      aggregateInstance.unstoredDomainEvents.push(domainEventWithState);

      return nextState;
    }
  };
};

export { getAggregateService };
