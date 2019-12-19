import { Aggregate } from '../common/elements/Aggregate';
import { AggregateEnhancer } from './AggregateEnhancer';
import { AggregatesService } from '../common/services/AggregatesService';
import { ClientService } from '../common/services/ClientService';
import { DomainEventData } from '../common/elements/DomainEventData';
import { DomainEventHandler } from '../common/elements/DomainEventHandler';
import { DomainEventWithState } from '../common/elements/DomainEventWithState';
import { LoggerService } from '../common/services/LoggerService';
import { State } from '../common/elements/State';

const withoutTags: AggregateEnhancer = function (aggregate: Aggregate<State>): Aggregate<State> {
  const enhancedDomainEventHandlers: Record<string, DomainEventHandler<State, DomainEventData>> = {};

  for (const domainEventName of Object.keys(aggregate.domainEventHandlers)) {
    const rawDomainEventHandler = aggregate.domainEventHandlers[domainEventName];

    enhancedDomainEventHandlers[domainEventName] = {
      ...rawDomainEventHandler,
      async map (state: State, domainEvent: DomainEventWithState<DomainEventData, State>, services: {
        aggregates: AggregatesService;
        client: ClientService;
        logger: LoggerService;
      }): Promise<DomainEventWithState<DomainEventData, State>> {
        let mappedDomainEvent = domainEvent;

        if (rawDomainEventHandler.map) {
          mappedDomainEvent = await rawDomainEventHandler.map(state, domainEvent, services);
        }

        return new DomainEventWithState({
          ...mappedDomainEvent,
          metadata: {
            ...mappedDomainEvent.metadata,
            tags: []
          }
        });
      }
    };
  }

  return {
    getInitialState: aggregate.getInitialState,
    commandHandlers: aggregate.commandHandlers,
    enhancers: aggregate.enhancers,
    domainEventHandlers: aggregate.domainEventHandlers
  };
};

export {
  withoutTags
};
