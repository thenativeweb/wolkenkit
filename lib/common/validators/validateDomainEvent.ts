import { Application } from '../application/Application';
import { DomainEvent } from '../elements/DomainEvent';
import { DomainEventData } from '../elements/DomainEventData';
import { parse } from 'validate-value';
import * as errors from '../errors';

const validateDomainEvent = function <TDomainEventData extends DomainEventData> ({
  domainEvent,
  application
}: {
  domainEvent: DomainEvent<TDomainEventData>;
  application: Application;
}): void {
  const contextDefinitions = application.domain;

  const {
    aggregateIdentifier: {
      context: { name: contextName },
      aggregate: { name: aggregateName }
    },
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

  parse(
    domainEventData,
    domainEventHandler.getSchema(),
    { valueName: 'domainEvent.data' }
  ).unwrapOrThrow(
    (err): Error => new errors.DomainEventMalformed({ message: err.message, cause: err })
  );
};

export { validateDomainEvent };
