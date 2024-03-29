import { AskInfrastructure } from '../../elements/AskInfrastructure';
import { cloneDeep } from 'lodash';
import { DomainEventData } from '../../elements/DomainEventData';
import { DomainEventHandler } from '../../elements/DomainEventHandler';
import { DomainEventWithState } from '../../elements/DomainEventWithState';
import { Services } from './Services';
import { State } from '../../elements/State';
import { TellInfrastructure } from '../../elements/TellInfrastructure';
import * as errors from '../../errors';

const isDomainEventAuthorized = async function ({
  domainEventWithState,
  aggregateState,
  domainEventHandler,
  services
}: {
  domainEventWithState: DomainEventWithState<DomainEventData, State>;
  aggregateState: State;
  domainEventHandler: DomainEventHandler<State, DomainEventData, AskInfrastructure & TellInfrastructure>;
  services: Services;
}): Promise<void> {
  const clonedDomainEvent = cloneDeep(domainEventWithState);

  const isAuthorized =
    await domainEventHandler.isAuthorized(aggregateState, clonedDomainEvent, services);

  if (!isAuthorized) {
    throw new errors.DomainEventNotAuthorized();
  }
};

export { isDomainEventAuthorized };
