import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { errors } from '../errors';
import { ItemIdentifier } from '../elements/ItemIdentifier';

const validateItemIdentifier = function ({
  itemIdentifier,
  applicationDefinition,
  itemType
}: {
  itemIdentifier: ItemIdentifier;
  applicationDefinition: ApplicationDefinition;
  itemType?: 'command' | 'domain-event';
}): void {
  const contextDefinitions = applicationDefinition.domain;

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
