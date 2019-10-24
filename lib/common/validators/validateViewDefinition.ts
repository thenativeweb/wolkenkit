import { errors } from '../errors';
import { validateProjectionDefinition } from './validateProjectionDefinition';
import { validateQueryDefinition } from './validateQueryDefinition';
import { isFunction, isObject, isString, isUndefined } from 'lodash';

const validateViewDefinition = function ({ viewDefinition }: {
  viewDefinition: any;
}): void {
  if (isUndefined(viewDefinition.store)) {
    throw new errors.ViewDefinitionMalformed(`Object 'store' is missing.`);
  }
  if (!isObject(viewDefinition.store)) {
    throw new errors.ViewDefinitionMalformed(`Property 'store' is not an object.`);
  }
  if (isUndefined(viewDefinition.store.type)) {
    throw new errors.ViewDefinitionMalformed(`String 'store.type' is missing.`);
  }
  if (!isString(viewDefinition.store.type)) {
    throw new errors.ViewDefinitionMalformed(`Property 'store.type' is not a string.`);
  }
  if (isUndefined(viewDefinition.store.setup)) {
    throw new errors.ViewDefinitionMalformed(`Function 'store.setup' is missing.`);
  }
  if (!isFunction(viewDefinition.store.setup)) {
    throw new errors.ViewDefinitionMalformed(`Property 'store.setup' is not a function.`);
  }

  if (isUndefined(viewDefinition.projections)) {
    throw new errors.ViewDefinitionMalformed(`Object 'projections' is missing.`);
  }
  if (!isObject(viewDefinition.projections)) {
    throw new errors.ViewDefinitionMalformed(`Property 'projections' is not an object.`);
  }

  for (const [ projectionName, projectionDefinition ] of Object.entries(viewDefinition.projections)) {
    try {
      validateProjectionDefinition({ projectionDefinition });
    } catch (ex) {
      throw new errors.ViewDefinitionMalformed(`Projection definition '${projectionName}' is malformed: ${ex.message}`);
    }
  }

  if (isUndefined(viewDefinition.queries)) {
    throw new errors.ViewDefinitionMalformed(`Object 'queries' is missing.`);
  }
  if (!isObject(viewDefinition.queries)) {
    throw new errors.ViewDefinitionMalformed(`Property 'queries' is not an object.`);
  }

  for (const [ queryName, queryDefinition ] of Object.entries(viewDefinition.queries)) {
    try {
      validateQueryDefinition({ queryDefinition });
    } catch (ex) {
      throw new errors.ViewDefinitionMalformed(`Command definition '${queryName}' is malformed: ${ex.message}`);
    }
  }
};

export { validateViewDefinition };
