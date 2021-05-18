import { isFunction, isObjectLike, isUndefined } from 'lodash';
import * as errors from '../errors';

const validateFlowDomainEventHandler = function ({ domainEventHandler }: {
  domainEventHandler: any;
}): void {
  if (!isObjectLike(domainEventHandler)) {
    throw new errors.FlowDomainEventHandlerMalformed(`Property 'domainEventHandler' is not an object.`);
  }

  if (isUndefined(domainEventHandler.isRelevant)) {
    throw new errors.FlowDomainEventHandlerMalformed(`Function 'isRelevant' is missing.`);
  }
  if (!isFunction(domainEventHandler.isRelevant)) {
    throw new errors.FlowDomainEventHandlerMalformed(`Property 'isRelevant' is not a function.`);
  }

  if (isUndefined(domainEventHandler.handle)) {
    throw new errors.FlowDomainEventHandlerMalformed(`Function 'handle' is missing.`);
  }
  if (!isFunction(domainEventHandler.handle)) {
    throw new errors.FlowDomainEventHandlerMalformed(`Property 'handle' is not a function.`);
  }
};

export { validateFlowDomainEventHandler };
