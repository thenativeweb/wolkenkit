import { Application } from '../application/Application';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { errors } from '../errors';
import { Value } from 'validate-value';

const validateDomainEvent = function <TDomainEventData extends DomainEventData> ({
  domainEvent,
  application
}: {
  domainEvent: DomainEvent<TDomainEventData>;
  application: Application;
}): void {
  const contextDefinitions = application.domain;

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
