import { errors } from '../errors';
import { validateProjectionHandler } from './validateProjectionHandler';
import { validateQueryHandler } from './validateQueryHandler';
import { isArray, isFunction, isObjectLike, isString, isUndefined } from 'lodash';

const validateViewDefinition = function ({ viewDefinition }: {
  viewDefinition: any;
}): void {
  if (!isObjectLike(viewDefinition)) {
    throw new errors.ViewDefinitionMalformed(`View handler is not an object.`);
  }

  if (isUndefined(viewDefinition.initializer)) {
    throw new errors.ViewDefinitionMalformed(`Object 'initializer' is missing.`);
  }
  if (!isObjectLike(viewDefinition.initializer)) {
    throw new errors.ViewDefinitionMalformed(`Property 'initializer' is not an object.`);
  }
  if (isUndefined(viewDefinition.initializer.storeType)) {
    throw new errors.ViewDefinitionMalformed(`String 'initializer.storeType' is missing.`);
  }
  if (!isString(viewDefinition.initializer.storeType)) {
    throw new errors.ViewDefinitionMalformed(`Property 'initializer.storeType' is not a string.`);
  }
  if (isUndefined(viewDefinition.initializer.initialize)) {
    throw new errors.ViewDefinitionMalformed(`Function 'initializer.initialize' is missing.`);
  }
  if (!isFunction(viewDefinition.initializer.initialize)) {
    throw new errors.ViewDefinitionMalformed(`Property 'initializer.initialize' is not a function.`);
  }

  if (isUndefined(viewDefinition.projectionHandlers)) {
    throw new errors.ViewDefinitionMalformed(`Object 'projectionHandlers' is missing.`);
  }
  if (!isObjectLike(viewDefinition.projectionHandlers)) {
    throw new errors.ViewDefinitionMalformed(`Property 'projectionHandlers' is not an object.`);
  }

  for (const [ projectionName, projectionHandler ] of Object.entries(viewDefinition.projectionHandlers)) {
    try {
      validateProjectionHandler({ projectionHandler });
    } catch (ex) {
      throw new errors.ViewDefinitionMalformed(`Projection handler '${projectionName}' is malformed: ${ex.message}`);
    }
  }

  if (isUndefined(viewDefinition.queryHandlers)) {
    throw new errors.ViewDefinitionMalformed(`Object 'queryHandlers' is missing.`);
  }
  if (!isObjectLike(viewDefinition.queryHandlers)) {
    throw new errors.ViewDefinitionMalformed(`Property 'queryHandlers' is not an object.`);
  }

  for (const [ queryName, queryHandler ] of Object.entries(viewDefinition.queryHandlers)) {
    try {
      validateQueryHandler({ queryHandler });
    } catch (ex) {
      throw new errors.ViewDefinitionMalformed(`Query handler '${queryName}' is malformed: ${ex.message}`);
    }
  }

  if (viewDefinition.enhancers) {
    if (!isArray(viewDefinition.enhancers)) {
      throw new errors.ViewDefinitionMalformed(`Property 'enhancers' is not an array.`);
    }

    for (const [ index, enhancer ] of viewDefinition.enhancers.entries()) {
      if (!isFunction(enhancer)) {
        throw new errors.ViewDefinitionMalformed(`View enhancer at index ${index} is not a function.`);
      }
    }
  }
};

export { validateViewDefinition };
