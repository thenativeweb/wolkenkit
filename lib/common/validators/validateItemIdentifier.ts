import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { errors } from '../errors';
import { ItemIdentifier } from '../elements/ItemIdentifier';

const validateItemIdentifier = function ({
  itemIdentifier,
  applicationDefinition
}: {
  itemIdentifier: ItemIdentifier;
  applicationDefinition: ApplicationDefinition;
}): void {
  const contextDefinitions = applicationDefinition.domain;

  const {
    contextIdentifier: { name: contextName },
    aggregateIdentifier: { name: aggregateName }
  } = itemIdentifier;

  if (!(contextName in contextDefinitions)) {
    throw new errors.ContextNotFound(`Context '${contextName}' not found.`);
  }
  if (!(aggregateName in contextDefinitions[contextName])) {
    throw new errors.AggregateNotFound(`Aggregate '${contextName}.${aggregateName}' not found.`);
  }
};

export { validateItemIdentifier };
