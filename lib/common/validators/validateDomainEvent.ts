import { ApplicationDefinition } from '../../../lib/common/application/ApplicationDefinition';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { errors } from '../errors';
import { getDomainEventSchema } from '../schemas/getDomainEventSchema';
import { Value } from 'validate-value';

const validateDomainEvent = function <TDomainEventData extends DomainEventData> ({
  domainEvent,
  applicationDefinition
}: {
  domainEvent: DomainEvent<TDomainEventData>;
  applicationDefinition: ApplicationDefinition;
}): void {
  const schema = getDomainEventSchema();

  try {
    schema.validate(domainEvent, { valueName: 'domainEvent' });
  } catch (ex) {
    throw new errors.DomainEventMalformed(ex.message);
  }

  if (
    domainEvent.metadata.revision.global !== null &&
    domainEvent.metadata.revision.aggregate > domainEvent.metadata.revision.global
  ) {
    throw new errors.DomainEventMalformed('Aggregate revision must be less than global revision.');
  }

  const contextDefinitions = applicationDefinition.domain;

  const {
    contextIdentifier: { name: contextName },
    aggregateIdentifier: { name: aggregateName },
    name: domainEventName,
    data: domainEventData
  } = domainEvent;

  if (!(contextName in contextDefinitions)) {
    throw new errors.ContextNotFound(`Context '${contextName}' not found.`);
  }
  if (!(aggregateName in contextDefinitions[contextName])) {
    throw new errors.AggregateNotFound(`Aggregate '${contextName}.${aggregateName}' not found.`);
  }
  if (!(domainEventName in contextDefinitions[contextName][aggregateName].domainEventHandlers)) {
    throw new errors.DomainEventNotFound(`Domain event '${contextName}.${aggregateName}.${domainEventName}' not found.`);
  }

  const { getSchema } = contextDefinitions[contextName][aggregateName].domainEventHandlers[domainEventName];

  if (!getSchema) {
    return;
  }

  const schemaData = new Value(getSchema());

  try {
    schemaData.validate(domainEventData, { valueName: 'domainEvent.data' });
  } catch (ex) {
    throw new errors.DomainEventMalformed(ex.message, { cause: ex });
  }
};

export { validateDomainEvent };
