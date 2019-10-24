import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { errors } from '../errors';
import { getDomainEventWithStateSchema } from '../schemas/getDomainEventWithStateSchema';
import { Todo } from '../../types/Todo';

const validateDomainEventWithState = function <TDomainEventData extends DomainEventData, TState> ({
  domainEvent,
  application
}: {
  domainEvent: DomainEventWithState<TDomainEventData, TState>;
  application: Todo;
}): void {
  const schema = getDomainEventWithStateSchema();

  try {
    schema.validate(domainEvent, { valueName: 'domainEvent' });
  } catch (ex) {
    throw new errors.DomainEventMalformed(ex.message);
  }

  if (
    (domainEvent.metadata.causationId && !domainEvent.metadata.correlationId) ||
    (!domainEvent.metadata.causationId && domainEvent.metadata.correlationId)
  ) {
    throw new errors.DomainEventMalformed('Causation id and correlation id must either be given both or none.');
  }

  // TODO: Validate event against application
  //       - Context, Aggregate, Commandname
  //       - Validate data against eventhandler.schema
};

export { validateDomainEventWithState };
