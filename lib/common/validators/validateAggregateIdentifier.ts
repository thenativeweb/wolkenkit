import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { errors } from '../errors';
import { getAggregateIdentifierSchema } from '../schemas/getAggregateIdentifierSchema';

const validateAggregateIdentifier = function ({
  aggregateIdentifier
}: {
  aggregateIdentifier: AggregateIdentifier;
}): void {
  const schemaAggregateIdentifier = getAggregateIdentifierSchema();

  try {
    schemaAggregateIdentifier.validate(aggregateIdentifier, { valueName: 'aggregateIdentifier' });
  } catch (ex) {
    throw new errors.AggregateIdentifierMalformed(ex.message);
  }
};

export { validateAggregateIdentifier };
