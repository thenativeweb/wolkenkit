import { Aggregate } from '../elements/Aggregate';
import { parseCommandHandler } from './parseCommandHandler';
import { parseDomainEventHandler } from './parseDomainEventHandler';
import { error, Result, value } from 'defekt';
import { isArray, isFunction, isObject, isUndefined } from 'lodash';
import * as errors from '../errors';

const parseAggregate = function ({ aggregate }: {
  aggregate: any;
}): Result<Aggregate<any, any>, errors.AggregateDefinitionMalformed> {
  if (isUndefined(aggregate.getInitialState)) {
    return error(new errors.AggregateDefinitionMalformed(`Function 'getInitialState' is missing.`));
  }
  if (!isFunction(aggregate.getInitialState)) {
    return error(new errors.AggregateDefinitionMalformed(`Property 'getInitialState' is not a function.`));
  }

  if (isUndefined(aggregate.commandHandlers)) {
    return error(new errors.AggregateDefinitionMalformed(`Object 'commandHandlers' is missing.`));
  }
  if (!isObject(aggregate.commandHandlers)) {
    return error(new errors.AggregateDefinitionMalformed(`Property 'commandHandlers' is not an object.`));
  }

  for (const [ commandHandlerName, commandHandler ] of Object.entries(aggregate.commandHandlers)) {
    const parseResult = parseCommandHandler({ commandHandler });

    if (parseResult.hasError()) {
      return error(new errors.AggregateDefinitionMalformed(`Command handler '${commandHandlerName}' is malformed: ${parseResult.error.message}`));
    }
  }

  if (isUndefined(aggregate.domainEventHandlers)) {
    return error(new errors.AggregateDefinitionMalformed(`Object 'domainEventHandlers' is missing.`));
  }
  if (!isObject(aggregate.domainEventHandlers)) {
    return error(new errors.AggregateDefinitionMalformed(`Property 'domainEventHandlers' is not an object.`));
  }

  for (const [ domainEventHandlerName, domainEventHandler ] of Object.entries(aggregate.domainEventHandlers)) {
    const parseResult = parseDomainEventHandler({ domainEventHandler });

    if (parseResult.hasError()) {
      return error(new errors.AggregateDefinitionMalformed(`Domain event handler '${domainEventHandlerName}' is malformed: ${parseResult.error.message}`));
    }
  }

  if (!isUndefined(aggregate.enhancers)) {
    if (!isArray(aggregate.enhancers)) {
      return error(new errors.AggregateDefinitionMalformed(`Property 'enhancers' is not an array.`));
    }

    for (const [ index, enhancer ] of aggregate.enhancers.entries()) {
      if (!isFunction(enhancer)) {
        return error(new errors.AggregateDefinitionMalformed(`Aggregate enhancer at index ${index} is not a function.`));
      }
    }
  }

  return value(aggregate);
};

export { parseAggregate };
