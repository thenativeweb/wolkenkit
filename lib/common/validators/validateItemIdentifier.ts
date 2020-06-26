import { Application } from '../application/Application';
import { errors } from '../errors';
import { ItemIdentifier } from '../elements/ItemIdentifier';

const validateItemIdentifier = function ({
  itemIdentifier,
  application,
  itemType
}: {
  itemIdentifier: ItemIdentifier;
  application: Application;
  itemType?: 'command' | 'domain-event';
}): void {
  const contextDefinitions = application.domain;

  const {
    contextIdentifier: { name: contextName },
    aggregateIdentifier: { name: aggregateName },
    name
  } = itemIdentifier;

  if (!(contextName in contextDefinitions)) {
    throw new errors.ContextNotFound(`Context '${contextName}' not found.`);
  }
  if (!(aggregateName in contextDefinitions[contextName])) {
    throw new errors.AggregateNotFound(`Aggregate '${contextName}.${aggregateName}' not found.`);
  }

  switch (itemType) {
    case 'command': {
      if (!(name in contextDefinitions[contextName][aggregateName].commandHandlers)) {
        throw new errors.CommandNotFound(`Command '${contextName}.${aggregateName}.${name}' not found.`);
      }

      break;
    }
    case 'domain-event': {
      if (!(name in contextDefinitions[contextName][aggregateName].domainEventHandlers)) {
        throw new errors.DomainEventNotFound(`Domain event '${contextName}.${aggregateName}.${name}' not found.`);
      }

      break;
    }
    default: {
      break;
    }
  }
};

export { validateItemIdentifier };
