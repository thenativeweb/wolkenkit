import { cloneDeep } from 'lodash';
import { DomainEventData } from '../../../../../common/elements/DomainEventData';
import { DomainEventHandler } from '../../../../../common/elements/DomainEventHandler';
import { DomainEventWithState } from '../../../../../common/elements/DomainEventWithState';
import { errors } from '../../../../../common/errors';
import { Services } from './Services';
import { State } from '../../../../../common/elements/State';

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
