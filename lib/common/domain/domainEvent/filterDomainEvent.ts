import { cloneDeep } from 'lodash';
import { DomainEventData } from '../../elements/DomainEventData';
import { DomainEventHandler } from '../../elements/DomainEventHandler';
import { DomainEventWithState } from '../../elements/DomainEventWithState';
import { errors } from '../../errors';
import { Services } from './Services';
import { State } from '../../elements/State';

const filterDomainEvent = async function ({
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
  /* eslint-disable @typescript-eslint/unbound-method */
  if (!domainEventHandler.filter) {
    return;
  }
  /* eslint-enable @typescript-eslint/unbound-method */

  const clonedDomainEvent = cloneDeep(domainEventWithState);

  const keepDomainEvent =
    await domainEventHandler.filter(aggregateState, clonedDomainEvent, services);

  if (!keepDomainEvent) {
    throw new errors.DomainEventRejected();
  }
};

export { filterDomainEvent };
