import { errors } from '../errors';
import { validateCommandDefinition } from './validateCommandDefinition';
import { validateDomainEventDefinition } from './validateDomainEventDefinition';
import { isFunction, isObject, isUndefined } from 'lodash';

const validateAggregateDefinition = function ({ aggregateDefinition }: {
  aggregateDefinition: any;
}): void {
  if (isUndefined(aggregateDefinition.State)) {
    throw new errors.AggregateDefinitionMalformed(`Class 'State' is missing.`);
  }
  if (!isFunction(aggregateDefinition.State)) {
    throw new errors.AggregateDefinitionMalformed(`Property 'State' is not a function.`);
  }

  if (isUndefined(aggregateDefinition.commands)) {
    throw new errors.AggregateDefinitionMalformed(`Object 'commands' is missing.`);
  }
  if (!isObject(aggregateDefinition.commands)) {
    throw new errors.AggregateDefinitionMalformed(`Property 'commands' is not an object.`);
  }

  for (const [ commandName, commandDefinition ] of Object.entries(aggregateDefinition.commands)) {
    try {
      validateCommandDefinition({ commandDefinition });
    } catch (ex) {
      throw new errors.AggregateDefinitionMalformed(`Command definition '${commandName}' is malformed: ${ex.message}`);
    }
  }

  if (isUndefined(aggregateDefinition.domainEvents)) {
    throw new errors.AggregateDefinitionMalformed(`Object 'domainEvents' is missing.`);
  }
  if (!isObject(aggregateDefinition.domainEvents)) {
    throw new errors.AggregateDefinitionMalformed(`Property 'domainEvents' is not an object.`);
  }

  for (const [ domainEventName, domainEventDefinition ] of Object.entries(aggregateDefinition.domainEvents)) {
    try {
      validateDomainEventDefinition({ domainEventDefinition });
    } catch (ex) {
      throw new errors.AggregateDefinitionMalformed(`Command definition '${domainEventName}' is malformed: ${ex.message}`);
    }
  }
};

export { validateAggregateDefinition };
