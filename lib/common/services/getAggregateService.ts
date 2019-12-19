import { AggregateService } from './AggregateService';
import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { CurrentAggregateState } from '../domain/CurrentAggregateState';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventHandler } from '../elements/DomainEventHandler';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { errors } from '../errors';
import { State } from '../elements/State';
import { uuid } from 'uuidv4';
import { Value } from 'validate-value';
import { cloneDeep, get } from 'lodash';

const getAggregateService = function <TState extends State> ({ currentAggregateState, applicationDefinition, command }: {
  currentAggregateState: CurrentAggregateState<TState>;
  applicationDefinition: ApplicationDefinition;
  command: CommandWithMetadata<any>;
}): AggregateService<TState> {
  return {
    id (): string {
      return currentAggregateState.aggregateIdentifier.id;
    },

    exists (): boolean {
      return currentAggregateState.exists();
    },

    publishDomainEvent <TDomainEventData extends DomainEventData> (
      domainEventName: string,
      data: TDomainEventData,
      metadata: { tags: string[] } = { tags: []}
    ): TState {
      const contextName = currentAggregateState.contextIdentifier.name;
      const aggregateName = currentAggregateState.aggregateIdentifier.name;

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
        contextIdentifier: currentAggregateState.contextIdentifier,
        aggregateIdentifier: currentAggregateState.aggregateIdentifier,
        name: domainEventName,
        data,
        id: uuid(),
        metadata: {
          causationId: command.id,
          correlationId: command.metadata.correlationId,
          timestamp: Date.now(),
          isPublished: false,
          initiator: command.metadata.initiator,
          revision: {
            aggregate: currentAggregateState.revision + currentAggregateState.unsavedDomainEvents.length + 1,
            global: null
          },
          tags: metadata.tags
        }
      });

      const previousState = cloneDeep(currentAggregateState.state);
      const nextState = currentAggregateState.applyDomainEvent({ applicationDefinition, domainEvent });

      const domainEventWithState = new DomainEventWithState({
        ...domainEvent,
        state: {
          previous: previousState,
          next: nextState
        }
      });

      currentAggregateState.unsavedDomainEvents.push(domainEventWithState);

      return nextState;
    }
  };
};

export { getAggregateService };
