import { AggregateInstance } from '../domain/AggregateInstance';
import { AggregateService } from './AggregateService';
import { Application } from '../application/Application';
import { AskInfrastructure } from '../elements/AskInfrastructure';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventHandler } from '../elements/DomainEventHandler';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { errors } from '../errors';
import { GetAggregateService } from './types/GetAggregateService';
import { State } from '../elements/State';
import { TellInfrastructure } from '../elements/TellInfrastructure';
import { v4 } from 'uuid';
import { Value } from 'validate-value';
import { cloneDeep, get } from 'lodash';

const getAggregateService: GetAggregateService = function <TState extends State> ({ aggregateInstance, application, command }: {
  aggregateInstance: AggregateInstance<TState>;
  application: Application;
  command: CommandWithMetadata<any>;
}): AggregateService<TState> {
  return {
    id (): string {
      return aggregateInstance.aggregateIdentifier.aggregate.id;
    },

    isPristine (): boolean {
      return aggregateInstance.isPristine();
    },

    publishDomainEvent <TDomainEventData extends DomainEventData> (
      domainEventName: string,
      data: TDomainEventData,
      // eslint-disable-next-line unicorn/no-object-as-default-parameter
      metadata: { tags: string[] } = { tags: []}
    ): TState {
      const contextName = aggregateInstance.aggregateIdentifier.context.name;
      const aggregateName = aggregateInstance.aggregateIdentifier.aggregate.name;

      const domainEventHandler = get(
        application.domain,
        [ contextName, aggregateName, 'domainEventHandlers', domainEventName ]
      ) as DomainEventHandler<State, DomainEventData, AskInfrastructure & TellInfrastructure> | undefined;

      if (!domainEventHandler) {
        throw new errors.DomainEventUnknown(`Failed to publish unknown domain event '${domainEventName}' in '${contextName}.${aggregateName}'.`);
      }

      if (domainEventHandler.getSchema) {
        const schema = domainEventHandler.getSchema();
        const value = new Value(schema);

        value.validate(data, { valueName: 'data' });
      }

      const domainEvent = new DomainEvent({
        aggregateIdentifier: aggregateInstance.aggregateIdentifier,
        name: domainEventName,
        data,
        id: v4(),
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
      const nextState = aggregateInstance.applyDomainEvent({ application, domainEvent });

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
