import { errors } from '../errors';
import { isFunction, isObjectLike, isUndefined } from 'lodash';

const validateDomainEventHandler = function ({ domainEventHandler }: {
  domainEventHandler: any;
}): void {
  if (!isObjectLike(domainEventHandler)) {
    throw new errors.DomainEventHandlerMalformed(`Property 'domainEventHandler' is not an object.`);
  }

  if (isUndefined(domainEventHandler.handle)) {
    throw new errors.DomainEventHandlerMalformed(`Function 'handle' is missing.`);
  }
  if (!isFunction(domainEventHandler.handle)) {
    throw new errors.DomainEventHandlerMalformed(`Property 'handle' is not a function.`);
  }

  if (isUndefined(domainEventHandler.isAuthorized)) {
    throw new errors.DomainEventHandlerMalformed(`Function 'isAuthorized' is missing.`);
  }
  if (!isFunction(domainEventHandler.isAuthorized)) {
    throw new errors.DomainEventHandlerMalformed(`Property 'isAuthorized' is not a function.`);
  }

  if (domainEventHandler.getDocumentation) {
    if (!isFunction(domainEventHandler.getDocumentation)) {
      throw new errors.DomainEventHandlerMalformed(`Property 'getDocumentation' is not a function.`);
    }
  }

  if (domainEventHandler.getSchema) {
    if (!isFunction(domainEventHandler.getSchema)) {
      throw new errors.DomainEventHandlerMalformed(`Property 'getSchema' is not a function.`);
    }
  }

  if (domainEventHandler.filter) {
    if (!isFunction(domainEventHandler.filter)) {
      throw new errors.DomainEventHandlerMalformed(`Property 'filter' is not a function.`);
    }
  }

  if (domainEventHandler.map) {
    if (!isFunction(domainEventHandler.map)) {
      throw new errors.DomainEventHandlerMalformed(`Property 'map' is not a function.`);
    }
  }
};

export { validateDomainEventHandler };
