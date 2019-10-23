import errors from '../errors';
import { isFunction, isUndefined } from 'lodash';

const validateQueryDefinition = function ({ queryDefinition }: {
  queryDefinition: any;
}): void {
  if (isUndefined(queryDefinition.handle)) {
    throw new errors.QueryDefinitionMalformed(`Function 'handle' is missing.`);
  }
  if (!isFunction(queryDefinition.handle)) {
    throw new errors.QueryDefinitionMalformed(`Property 'handle' is not a function.`);
  }

  if (isUndefined(queryDefinition.isAuthorized)) {
    throw new errors.QueryDefinitionMalformed(`Function 'isAuthorized' is missing.`);
  }
  if (!isFunction(queryDefinition.isAuthorized)) {
    throw new errors.QueryDefinitionMalformed(`Property 'isAuthorized' is not a function.`);
  }

  if (queryDefinition.getDocumentation) {
    if (!isFunction(queryDefinition.getDocumentation)) {
      throw new errors.QueryDefinitionMalformed(`Property 'getDocumentation' is not a function.`);
    }
  }

  if (queryDefinition.getOptionsSchema) {
    if (!isFunction(queryDefinition.getOptionsSchema)) {
      throw new errors.QueryDefinitionMalformed(`Property 'getOptionsSchema' is not a function.`);
    }
  }

  if (queryDefinition.getItemSchema) {
    if (!isFunction(queryDefinition.getItemSchema)) {
      throw new errors.QueryDefinitionMalformed(`Property 'getItemSchema' is not a function.`);
    }
  }
};

export default validateQueryDefinition;
