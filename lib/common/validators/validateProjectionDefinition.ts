import { errors } from '../errors';
import { isFunction, isString, isUndefined } from 'lodash';

const validateProjectionDefinition = function ({ projectionDefinition }: {
  projectionDefinition: any;
}): void {
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
