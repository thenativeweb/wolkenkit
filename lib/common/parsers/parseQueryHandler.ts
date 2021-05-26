import { QueryHandlerReturnsStream } from '../elements/QueryHandlerReturnsStream';
import { QueryHandlerReturnsValue } from '../elements/QueryHandlerReturnsValue';
import { error, Result, value } from 'defekt';
import { isFunction, isObjectLike, isUndefined } from 'lodash';
import * as errors from '../errors';

const parseQueryHandler = function ({ queryHandler }: {
  queryHandler: any;
}): Result<QueryHandlerReturnsStream<any, any> | QueryHandlerReturnsValue<any, any>, errors.QueryHandlerMalformed> {
  if (!isObjectLike(queryHandler)) {
    return error(new errors.QueryHandlerMalformed(`Query handler is not an object.`));
  }

  if (isUndefined(queryHandler.type)) {
    return error(new errors.QueryHandlerMalformed(`Property 'type' is missing.`));
  }
  if (queryHandler.type !== 'value' && queryHandler.type !== 'stream') {
    return error(new errors.QueryHandlerMalformed(`Property 'type' must either be 'value' or 'stream'.`));
  }

  if (isUndefined(queryHandler.handle)) {
    return error(new errors.QueryHandlerMalformed(`Function 'handle' is missing.`));
  }
  if (!isFunction(queryHandler.handle)) {
    return error(new errors.QueryHandlerMalformed(`Property 'handle' is not a function.`));
  }

  if (isUndefined(queryHandler.isAuthorized)) {
    return error(new errors.QueryHandlerMalformed(`Function 'isAuthorized' is missing.`));
  }
  if (!isFunction(queryHandler.isAuthorized)) {
    return error(new errors.QueryHandlerMalformed(`Property 'isAuthorized' is not a function.`));
  }

  if (!isUndefined(queryHandler.getDocumentation) && !isFunction(queryHandler.getDocumentation)) {
    return error(new errors.QueryHandlerMalformed(`Property 'getDocumentation' is not a function.`));
  }

  if (!isUndefined(queryHandler.getOptionsSchema) && !isFunction(queryHandler.getOptionsSchema)) {
    return error(new errors.QueryHandlerMalformed(`Property 'getOptionsSchema' is not a function.`));
  }

  if (!isUndefined(queryHandler.getItemSchema) && !isFunction(queryHandler.getItemSchema)) {
    return error(new errors.QueryHandlerMalformed(`Property 'getItemSchema' is not a function.`));
  }

  return value(queryHandler);
};

export { parseQueryHandler };
