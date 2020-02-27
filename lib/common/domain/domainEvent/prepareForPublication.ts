import { ApplicationDefinition } from '../../application/ApplicationDefinition';
import { DomainEvent } from '../../elements/DomainEvent';
import { DomainEventData } from '../../elements/DomainEventData';
import { DomainEventWithState } from '../../elements/DomainEventWithState';
import { filterDomainEvent } from './filterDomainEvent';
import { isDomainEventAuthorized } from './isDomainEventAuthorized';
import { mapDomainEvent } from './mapDomainEvent';
import { partOf } from 'partof';
import { Repository } from '../Repository';
import { Services } from './Services';
import { State } from '../../elements/State';

const prepareForPublication = async function ({
  domainEventWithState,
  domainEventFilter,
  applicationDefinition,
  repository,
  services
}: {
  domainEventWithState: DomainEventWithState<DomainEventData, State>;
  domainEventFilter: object;
  applicationDefinition: ApplicationDefinition;
  repository: Repository;
  services: Services;
}): Promise<DomainEvent<DomainEventData> | undefined> {
  if (!partOf(domainEventFilter, domainEventWithState)) {
    return;
  }

  const {
    contextIdentifier,
    aggregateIdentifier,
    name: domainEventName
  } = domainEventWithState;

  const { name: contextName } = contextIdentifier;
  const { name: aggregateName } = aggregateIdentifier;

  const aggregateInstance = await repository.loadCurrentAggregateState({ contextIdentifier, aggregateIdentifier });
  const aggregateState = aggregateInstance.state;

  const domainEventHandler =
    applicationDefinition.domain[contextName]![aggregateName]!.domainEventHandlers[domainEventName]!;

  try {
    await isDomainEventAuthorized({ domainEventWithState, aggregateState, domainEventHandler, services });
    await filterDomainEvent({ domainEventWithState, aggregateState, domainEventHandler, services });

    const mappedDomainEvent = await mapDomainEvent({ domainEventWithState, aggregateState, domainEventHandler, services });

    const domainEvent = mappedDomainEvent.withoutState();

    return domainEvent;
  } catch (ex) {
    switch (ex.code) {
      case 'EDOMAINEVENTNOTAUTHORIZED':
      case 'EDOMAINEVENTREJECTED':
        // Ignore these exceptions, as this is usual control flow in this case,
        // which means that we simply don't want the domain event to be served.
        // Hence, we return nothing here.
        return;
      default:
        // In case of an actual error, we don't want the runtime to crash. So we
        // only log that something went wrong and hinder that the domain event
        // gets served.
        services.logger.error('Prepare for publication failed.', { ex });
    }
  }
};

export { prepareForPublication };
