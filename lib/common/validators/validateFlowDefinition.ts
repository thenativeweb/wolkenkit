import { errors } from '../errors';
import { validateFlowDomainEventHandler } from './validateFlowDomainEventHandler';
import { isArray, isFunction, isObjectLike, isUndefined } from 'lodash';

const validateFlowDefinition = function ({ flowDefinition }: {
  flowDefinition: any;
}): void {
  if (!isObjectLike(flowDefinition)) {
    throw new errors.FlowDefinitionMalformed('Flow handler is not an object.');
  }

  if (isUndefined(flowDefinition.domainEventHandlers)) {
    throw new errors.FlowDefinitionMalformed(`Object 'domainEventHandlers' is missing.`);
  }
  if (!isObjectLike(flowDefinition.domainEventHandlers)) {
    throw new errors.FlowDefinitionMalformed(`Property 'domainEventHandlers' is not an object.`);
  }

  for (const [ domainEventHandlerName, domainEventHandler ] of Object.entries(flowDefinition.domainEventHandlers)) {
    try {
      validateFlowDomainEventHandler({ domainEventHandler });
    } catch (ex: unknown) {
      throw new errors.FlowDefinitionMalformed(`Domain event handler '${domainEventHandlerName}' is malformed: ${(ex as Error).message}`);
    }
  }

  if (!isUndefined(flowDefinition.enhancers)) {
    if (!isArray(flowDefinition.enhancers)) {
      throw new errors.FlowDefinitionMalformed(`Property 'enhancers' is not an array.`);
    }

    for (const [ index, enhancer ] of flowDefinition.enhancers.entries()) {
      if (!isFunction(enhancer)) {
        throw new errors.FlowDefinitionMalformed(`Flow enhancer at index '${index}' is not a function.`);
      }
    }
  }
};

export { validateFlowDefinition };
