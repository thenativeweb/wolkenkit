import { Application } from '../../application/Application';
import { CustomError } from 'defekt';
import { DomainEvent } from '../../elements/DomainEvent';
import { DomainEventData } from '../../elements/DomainEventData';
import { DomainEventWithState } from '../../elements/DomainEventWithState';
import { errors } from '../../errors';
import { filterDomainEvent } from './filterDomainEvent';
import { flaschenpost } from 'flaschenpost';
import { isDomainEventAuthorized } from './isDomainEventAuthorized';
import { mapDomainEvent } from './mapDomainEvent';
import { partOf } from 'partof';
import { Repository } from '../Repository';
import { Services } from './Services';
import { State } from '../../elements/State';
import { withLogMetadata } from '../../utils/logging/withLogMetadata';

const logger = flaschenpost.getLogger();

const prepareForPublication = async function ({
  domainEventWithState,
  domainEventFilter,
  application,
  repository,
  services
}: {
  domainEventWithState: DomainEventWithState<DomainEventData, State>;
  domainEventFilter: Record<string, unknown>;
  application: Application;
  repository: Repository;
  services: Services;
}): Promise<DomainEvent<DomainEventData> | undefined> {
  if (!partOf(domainEventFilter, domainEventWithState)) {
    return;
  }

  const {
    aggregateIdentifier: {
      context: { name: contextName },
      aggregate: { name: aggregateName }
    },
    name: domainEventName
  } = domainEventWithState;

  const { aggregateIdentifier } = domainEventWithState;

  const aggregateInstance = await repository.getAggregateInstance({
    aggregateIdentifier
  });
  const aggregateState = aggregateInstance.state;

  const domainEventHandler =
    application.domain[contextName]![aggregateName]!.domainEventHandlers[domainEventName]!;

  try {
    await isDomainEventAuthorized({ domainEventWithState, aggregateState, domainEventHandler, services });
    await filterDomainEvent({ domainEventWithState, aggregateState, domainEventHandler, services });

    const mappedDomainEvent = await mapDomainEvent({ domainEventWithState, aggregateState, domainEventHandler, services });

    const domainEvent = mappedDomainEvent.withoutState();

    return domainEvent;
  } catch (ex: unknown) {
    switch ((ex as CustomError).code) {
      case errors.DomainEventNotAuthorized.code:
      case errors.DomainEventRejected.code:
        // Ignore these exceptions, as this is usual control flow in this case,
        // which means that we simply don't want the domain event to be served.
        // Hence, we return nothing here.
        return;
      default:
        // In case of an actual error, we don't want the runtime to crash. So we
        // only log that something went wrong and hinder that the domain event
        // gets served.
        logger.error(
          'Preparing domain event for publication failed.',
          withLogMetadata('common', 'prepareForPublication', { error: ex })
        );
    }
  }
};

export { prepareForPublication };
