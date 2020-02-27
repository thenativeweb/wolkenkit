import { cloneDeep } from 'lodash';
import { DomainEventData } from '../../elements/DomainEventData';
import { DomainEventHandler } from '../../elements/DomainEventHandler';
import { DomainEventWithState } from '../../elements/DomainEventWithState';
import { errors } from '../../errors';
import { Services } from './Services';
import { State } from '../../elements/State';

const isDomainEventAuthorized = async function ({
  domainEventWithState,
  aggregateState,
  domainEventHandler,
  services
}: {
  domainEventWithState: DomainEventWithState<DomainEventData, State>;
  aggregateState: State;
  domainEventHandler: DomainEventHandler<State, DomainEventData>;
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
