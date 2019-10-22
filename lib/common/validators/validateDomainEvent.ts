import DomainEvent from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import errors from '../errors';
import getDomainEventSchema from '../schemas/getDomainEventSchema';
import { Todo } from '../../types/Todo';

const validateDomainEvent = function <TDomainEventData extends DomainEventData> ({
  domainEvent,
  application
}: {
  domainEvent: DomainEvent<TDomainEventData>;
  application: Todo;
}): void {
  const schema = getDomainEventSchema();

  try {
    schema.validate(domainEvent, { valueName: 'event' });
  } catch (ex) {
    throw new errors.EventMalformed(ex.message);
  }

  // TODO: Validate event against application
  //       - Context, Aggregate, Commandname
  //       - Validate data against eventhandler.schema
};

export default validateDomainEvent;
