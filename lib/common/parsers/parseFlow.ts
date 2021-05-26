import { Flow } from '../elements/Flow';
import { parseFlowHandler } from './parseFlowHandler';
import { error, Result, value } from 'defekt';
import { isArray, isFunction, isObjectLike, isUndefined } from 'lodash';
import * as errors from '../errors';

const parseFlow = function ({ flowDefinition }: {
  flowDefinition: any;
}): Result<Flow<any>, errors.FlowDefinitionMalformed> {
  if (!isObjectLike(flowDefinition)) {
    return error(new errors.FlowDefinitionMalformed('Flow handler is not an object.'));
  }

  if (isUndefined(flowDefinition.domainEventHandlers)) {
    return error(new errors.FlowDefinitionMalformed(`Object 'domainEventHandlers' is missing.`));
  }
  if (!isObjectLike(flowDefinition.domainEventHandlers)) {
    return error(new errors.FlowDefinitionMalformed(`Property 'domainEventHandlers' is not an object.`));
  }

  for (const [ domainEventHandlerName, domainEventHandler ] of Object.entries(flowDefinition.domainEventHandlers)) {
    const parseResult = parseFlowHandler({ domainEventHandler });

    if (parseResult.hasError()) {
      return error(new errors.FlowDefinitionMalformed(`Domain event handler '${domainEventHandlerName}' is malformed: ${parseResult.error.message}`));
    }
  }

  if (!isUndefined(flowDefinition.enhancers)) {
    if (!isArray(flowDefinition.enhancers)) {
      return error(new errors.FlowDefinitionMalformed(`Property 'enhancers' is not an array.`));
    }

    for (const [ index, enhancer ] of flowDefinition.enhancers.entries()) {
      if (!isFunction(enhancer)) {
        return error(new errors.FlowDefinitionMalformed(`Flow enhancer at index '${index}' is not a function.`));
      }
    }
  }

  return value(flowDefinition);
};

export { parseFlow };
