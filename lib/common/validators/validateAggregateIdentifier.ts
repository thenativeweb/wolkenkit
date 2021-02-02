import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { Application } from '../application/Application';
import { errors } from '../errors';

const validateAggregateIdentifier = function ({
  aggregateIdentifier,
  application
}: {
  aggregateIdentifier: AggregateIdentifier;
  application: Application;
}): void {
  const contextDefinitions = application.domain;

  if (!(aggregateIdentifier.context.name in contextDefinitions)) {
    throw new errors.ContextNotFound(`Context '${aggregateIdentifier.context.name}' not found.`);
  }
  if (!(aggregateIdentifier.aggregate.name in contextDefinitions[aggregateIdentifier.context.name])) {
    throw new errors.AggregateNotFound(`Aggregate '${aggregateIdentifier.context.name}.${aggregateIdentifier.aggregate.name}' not found.`);
  }
};

export { validateAggregateIdentifier };
