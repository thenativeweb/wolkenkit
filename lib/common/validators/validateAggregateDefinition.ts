import { errors } from '../errors';
import { validateCommandHandler } from './validateCommandHandler';
import { validateDomainEventHandler } from './validateDomainEventHandler';
import { isArray, isFunction, isObject, isUndefined } from 'lodash';

const validateAggregateDefinition = function ({ aggregateDefinition }: {
  aggregateDefinition: any;
}): void {
  if (isUndefined(aggregateDefinition.getInitialState)) {
    throw new errors.AggregateDefinitionMalformed(`Function 'getInitialState' is missing.`);
  }
  if (!isFunction(aggregateDefinition.getInitialState)) {
    throw new errors.AggregateDefinitionMalformed(`Property 'getInitialState' is not a function.`);
  }

  if (isUndefined(aggregateDefinition.commandHandlers)) {
    throw new errors.AggregateDefinitionMalformed(`Object 'commandHandlers' is missing.`);
  }
  if (!isObject(aggregateDefinition.commandHandlers)) {
    throw new errors.AggregateDefinitionMalformed(`Property 'commandHandlers' is not an object.`);
  }

  for (const [ commandHandlerName, commandHandler ] of Object.entries(aggregateDefinition.commandHandlers)) {
    try {
      validateCommandHandler({ commandHandler });
    } catch (ex) {
      throw new errors.AggregateDefinitionMalformed(`Command handler '${commandHandlerName}' is malformed: ${ex.message}`);
    }
  }

  if (isUndefined(aggregateDefinition.domainEventHandlers)) {
    throw new errors.AggregateDefinitionMalformed(`Object 'domainEventHandlers' is missing.`);
  }
  if (!isObject(aggregateDefinition.domainEventHandlers)) {
    throw new errors.AggregateDefinitionMalformed(`Property 'domainEventHandlers' is not an object.`);
  }

  for (const [ domainEventHandlerName, domainEventHandler ] of Object.entries(aggregateDefinition.domainEventHandlers)) {
    try {
      validateDomainEventHandler({ domainEventHandler });
    } catch (ex) {
      throw new errors.AggregateDefinitionMalformed(`Domain event handler '${domainEventHandlerName}' is malformed: ${ex.message}`);
    }
  }

  if (aggregateDefinition.enhancers) {
    if (!isArray(aggregateDefinition.enhancers)) {
      throw new errors.AggregateDefinitionMalformed(`Property 'enhancers' is not an array.`);
    }

    for (const [ index, enhancer ] of aggregateDefinition.enhancers.entries()) {
      if (!isFunction(enhancer)) {
        throw new errors.AggregateDefinitionMalformed(`Aggregate enhancer at index ${index} is not a function.`);
      }
    }
  }
};

export { validateAggregateDefinition };
