import { cloneDeep } from 'lodash';
import { DomainEventData } from '../../../../../common/elements/DomainEventData';
import { DomainEventHandler } from '../../../../../common/elements/DomainEventHandler';
import { DomainEventWithState } from '../../../../../common/elements/DomainEventWithState';
import { Services } from './Services';
import { State } from '../../../../../common/elements/State';

const mapDomainEvent = async function ({
  domainEventWithState,
  aggregateState,
  domainEventHandler,
  services
}: {
  domainEventWithState: DomainEventWithState<DomainEventData, State>;
  aggregateState: State;
  domainEventHandler: DomainEventHandler<State, DomainEventData>;
  services: Services;
}): Promise<DomainEventWithState<DomainEventData, State>> {
  /* eslint-disable @typescript-eslint/unbound-method */
  if (!domainEventHandler.map) {
    return domainEventWithState;
  }
  /* eslint-enable @typescript-eslint/unbound-method */

  const clonedDomainEvent = cloneDeep(domainEventWithState);

  const mappedDomainEvent =
    await domainEventHandler.map(aggregateState, clonedDomainEvent, services);

  return mappedDomainEvent;
};

export { mapDomainEvent };
