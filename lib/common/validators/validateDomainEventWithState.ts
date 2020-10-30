import { Application } from '../application/Application';
import { DomainEventData } from '../elements/DomainEventData';
import { DomainEventWithState } from '../elements/DomainEventWithState';
import { errors } from '../errors';
import { Value } from 'validate-value';

const validateDomainEventWithState = function <TDomainEventData extends DomainEventData, TState> ({
  domainEvent,
  application
}: {
  domainEvent: DomainEventWithState<TDomainEventData, TState>;
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

export { validateDomainEventWithState };
