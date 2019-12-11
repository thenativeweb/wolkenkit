import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { errors } from '../errors';
import { getItemIdentifierSchema } from '../schemas/getItemIdentifierSchema';
import { ItemIdentifier } from '../elements/ItemIdentifier';

const validateItemIdentifier = function ({
  itemIdentifier,
  applicationDefinition
}: {
  itemIdentifier: ItemIdentifier;
  applicationDefinition: ApplicationDefinition;
}): void {
  const schemaItemIdentifier = getItemIdentifierSchema();

  try {
    schemaItemIdentifier.validate(itemIdentifier, { valueName: 'itemIdentifier' });
  } catch (ex) {
    throw new errors.ItemIdentifierMalformed(ex.message);
  }

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
