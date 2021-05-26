import { DomainEventHandler } from '../elements/DomainEventHandler';
import { error, Result, value } from 'defekt';
import { isFunction, isObjectLike, isUndefined } from 'lodash';
import * as errors from '../errors';

const parseDomainEventHandler = function ({ domainEventHandler }: {
  domainEventHandler: any;
}): Result<DomainEventHandler<any, any, any>, errors.DomainEventHandlerMalformed> {
  if (!isObjectLike(domainEventHandler)) {
    return error(new errors.DomainEventHandlerMalformed(`Property 'domainEventHandler' is not an object.`));
  }

  if (isUndefined(domainEventHandler.handle)) {
    return error(new errors.DomainEventHandlerMalformed(`Function 'handle' is missing.`));
  }
  if (!isFunction(domainEventHandler.handle)) {
    return error(new errors.DomainEventHandlerMalformed(`Property 'handle' is not a function.`));
  }

  if (isUndefined(domainEventHandler.isAuthorized)) {
    return error(new errors.DomainEventHandlerMalformed(`Function 'isAuthorized' is missing.`));
  }
  if (!isFunction(domainEventHandler.isAuthorized)) {
    return error(new errors.DomainEventHandlerMalformed(`Property 'isAuthorized' is not a function.`));
  }

  if (!isUndefined(domainEventHandler.getDocumentation) && !isFunction(domainEventHandler.getDocumentation)) {
    return error(new errors.DomainEventHandlerMalformed(`Property 'getDocumentation' is not a function.`));
  }

  if (!isUndefined(domainEventHandler.getSchema) && !isFunction(domainEventHandler.getSchema)) {
    return error(new errors.DomainEventHandlerMalformed(`Property 'getSchema' is not a function.`));
  }

  if (!isUndefined(domainEventHandler.filter) && !isFunction(domainEventHandler.filter)) {
    return error(new errors.DomainEventHandlerMalformed(`Property 'filter' is not a function.`));
  }

  if (!isUndefined(domainEventHandler.map) && !isFunction(domainEventHandler.map)) {
    return error(new errors.DomainEventHandlerMalformed(`Property 'map' is not a function.`));
  }

  return value(domainEventHandler);
};

export { parseDomainEventHandler };
