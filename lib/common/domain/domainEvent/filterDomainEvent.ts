import { AskInfrastructure } from '../../elements/AskInfrastructure';
import { cloneDeep } from 'lodash';
import { DomainEventData } from '../../elements/DomainEventData';
import { DomainEventHandler } from '../../elements/DomainEventHandler';
import { DomainEventWithState } from '../../elements/DomainEventWithState';
import { Services } from './Services';
import { State } from '../../elements/State';
import { TellInfrastructure } from '../../elements/TellInfrastructure';
import * as errors from '../../errors';

const filterDomainEvent = async function ({
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
  if (!domainEventHandler.filter) {
    return;
  }

  const clonedDomainEvent = cloneDeep(domainEventWithState);

  const keepDomainEvent =
    await domainEventHandler.filter(aggregateState, clonedDomainEvent, services);

  if (!keepDomainEvent) {
    throw new errors.DomainEventRejected();
  }
};

export { filterDomainEvent };
