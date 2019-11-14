import { errors } from '../errors';
import { isFunction, isObjectLike, isUndefined } from 'lodash';

const validateQueryHandler = function ({ queryHandler }: {
  queryHandler: any;
}): void {
  if (!isObjectLike(queryHandler)) {
    throw new errors.QueryHandlerMalformed(`Query handler is not an object.`);
  }

  if (isUndefined(queryHandler.handle)) {
    throw new errors.QueryHandlerMalformed(`Function 'handle' is missing.`);
  }
  if (!isFunction(queryHandler.handle)) {
    throw new errors.QueryHandlerMalformed(`Property 'handle' is not a function.`);
  }

  if (isUndefined(queryHandler.isAuthorized)) {
    throw new errors.QueryHandlerMalformed(`Function 'isAuthorized' is missing.`);
  }
  if (!isFunction(queryHandler.isAuthorized)) {
    throw new errors.QueryHandlerMalformed(`Property 'isAuthorized' is not a function.`);
  }

  if (queryHandler.getDocumentation) {
    if (!isFunction(queryHandler.getDocumentation)) {
      throw new errors.QueryHandlerMalformed(`Property 'getDocumentation' is not a function.`);
    }
  }

  if (queryHandler.getOptionsSchema) {
    if (!isFunction(queryHandler.getOptionsSchema)) {
      throw new errors.QueryHandlerMalformed(`Property 'getOptionsSchema' is not a function.`);
    }
  }

  if (queryHandler.getItemSchema) {
    if (!isFunction(queryHandler.getItemSchema)) {
      throw new errors.QueryHandlerMalformed(`Property 'getItemSchema' is not a function.`);
    }
  }
};

export { validateQueryHandler };
