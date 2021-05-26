import { FlowHandler } from '../elements/FlowHandler';
import { error, Result, value } from 'defekt';
import { isFunction, isObjectLike, isUndefined } from 'lodash';
import * as errors from '../errors';

const parseFlowHandler = function ({ domainEventHandler }: {
  domainEventHandler: any;
}): Result<FlowHandler<any, any>, errors.FlowDomainEventHandlerMalformed> {
  if (!isObjectLike(domainEventHandler)) {
    return error(new errors.FlowDomainEventHandlerMalformed(`Property 'domainEventHandler' is not an object.`));
  }

  if (isUndefined(domainEventHandler.isRelevant)) {
    return error(new errors.FlowDomainEventHandlerMalformed(`Function 'isRelevant' is missing.`));
  }
  if (!isFunction(domainEventHandler.isRelevant)) {
    return error(new errors.FlowDomainEventHandlerMalformed(`Property 'isRelevant' is not a function.`));
  }

  if (isUndefined(domainEventHandler.handle)) {
    return error(new errors.FlowDomainEventHandlerMalformed(`Function 'handle' is missing.`));
  }
  if (!isFunction(domainEventHandler.handle)) {
    return error(new errors.FlowDomainEventHandlerMalformed(`Property 'handle' is not a function.`));
  }

  return value(domainEventHandler);
};

export { parseFlowHandler };
