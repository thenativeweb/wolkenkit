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

  const domainEventHandler = contextDefinitions[contextName][aggregateName].domainEventHandlers[domainEventName];

  if (!domainEventHandler.getSchema) {
    return;
  }

  const schemaData = new Value(domainEventHandler.getSchema());

  try {
    schemaData.validate(domainEventData, { valueName: 'domainEvent.data' });
  } catch (ex: unknown) {
    throw new errors.DomainEventMalformed((ex as Error).message, { cause: ex as Error });
  }
};

export { validateDomainEvent };
