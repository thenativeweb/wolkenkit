import { errors } from '../errors';
import { isFunction, isObjectLike, isString, isUndefined } from 'lodash';

const validateProjectionDefinition = function ({ projectionDefinition }: {
  projectionDefinition: any;
}): void {
  if (!isObjectLike(projectionDefinition)) {
    throw new errors.ProjectionDefinitionMalformed(`Property 'projectionDefinition' is not an object.`);
  }

  if (isUndefined(projectionDefinition.selector)) {
    throw new errors.ProjectionDefinitionMalformed(`String 'selector' is missing.`);
  }
  if (!isString(projectionDefinition.selector)) {
    throw new errors.ProjectionDefinitionMalformed(`Property 'selector' is not a string.`);
  }

  if (isUndefined(projectionDefinition.handle)) {
    throw new errors.ProjectionDefinitionMalformed(`Function 'handle' is missing.`);
  }
  if (!isFunction(projectionDefinition.handle)) {
    throw new errors.ProjectionDefinitionMalformed(`Property 'handle' is not a function.`);
  }
};

export { validateProjectionDefinition };
