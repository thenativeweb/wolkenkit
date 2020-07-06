import { AggregateIdentifier } from '../elements/AggregateIdentifier';
import { Application } from '../application/Application';
import { ContextIdentifier } from '../elements/ContextIdentifier';
import { errors } from '../errors';

const validateContextAndAggregateIdentifier = function ({
  contextIdentifier,
  aggregateIdentifier,
  application
}: {
  contextIdentifier: ContextIdentifier;
  aggregateIdentifier: AggregateIdentifier;
  application: Application;
}): void {
  const contextDefinitions = application.domain;

  if (!(contextIdentifier.name in contextDefinitions)) {
    throw new errors.ContextNotFound(`Context '${contextIdentifier.name}' not found.`);
  }
  if (!(aggregateIdentifier.name in contextDefinitions[contextIdentifier.name])) {
    throw new errors.AggregateNotFound(`Aggregate '${contextIdentifier.name}.${aggregateIdentifier.name}' not found.`);
  }
};

export { validateContextAndAggregateIdentifier };
