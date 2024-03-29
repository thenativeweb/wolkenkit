import { AskInfrastructure } from '../../elements/AskInfrastructure';
import { cloneDeep } from 'lodash';
import { DomainEventData } from '../../elements/DomainEventData';
import { DomainEventHandler } from '../../elements/DomainEventHandler';
import { DomainEventWithState } from '../../elements/DomainEventWithState';
import { Services } from './Services';
import { State } from '../../elements/State';
import { TellInfrastructure } from '../../elements/TellInfrastructure';

const mapDomainEvent = async function ({
  domainEventWithState,
  aggregateState,
  domainEventHandler,
  services
}: {
  domainEventWithState: DomainEventWithState<DomainEventData, State>;
  aggregateState: State;
  domainEventHandler: DomainEventHandler<State, DomainEventData, AskInfrastructure & TellInfrastructure>;
  services: Services;
}): Promise<DomainEventWithState<DomainEventData, State>> {
  if (!domainEventHandler.map) {
    return domainEventWithState;
  }

  const clonedDomainEvent = cloneDeep(domainEventWithState);

  const mappedDomainEvent =
    await domainEventHandler.map(aggregateState, clonedDomainEvent, services);

  return mappedDomainEvent;
};

export { mapDomainEvent };
