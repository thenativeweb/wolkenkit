import { errors } from '../errors';
import { isFunction, isObjectLike, isString, isUndefined } from 'lodash';

const validateProjectionHandler = function ({ projectionHandler }: {
  projectionHandler: any;
}): void {
  if (!isObjectLike(projectionHandler)) {
    throw new errors.ProjectionHandlerMalformed(`Projection handler is not an object.`);
  }

  if (isUndefined(projectionHandler.selector)) {
    throw new errors.ProjectionHandlerMalformed(`String 'selector' is missing.`);
  }
  if (!isString(projectionHandler.selector)) {
    throw new errors.ProjectionHandlerMalformed(`Property 'selector' is not a string.`);
  }

  if (isUndefined(projectionHandler.handle)) {
    throw new errors.ProjectionHandlerMalformed(`Function 'handle' is missing.`);
  }
  if (!isFunction(projectionHandler.handle)) {
    throw new errors.ProjectionHandlerMalformed(`Property 'handle' is not a function.`);
  }
};

export { validateProjectionHandler };
