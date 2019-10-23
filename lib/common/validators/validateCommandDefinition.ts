import errors from '../errors';
import { isFunction, isUndefined } from 'lodash';

const validateCommandDefinition = function ({ commandDefinition }: {
  commandDefinition: any;
}): void {
  if (isUndefined(commandDefinition.isAuthorized)) {
    throw new errors.CommandDefinitionMalformed(`Function 'isAuthorized' is missing.`);
  }
  if (!isFunction(commandDefinition.isAuthorized)) {
    throw new errors.CommandDefinitionMalformed(`Property 'isAuthorized' is not a function.`);
  }

  if (isUndefined(commandDefinition.handle)) {
    throw new errors.CommandDefinitionMalformed(`Function 'handle' is missing.`);
  }
  if (!isFunction(commandDefinition.handle)) {
    throw new errors.CommandDefinitionMalformed(`Property 'handle' is not a function.`);
  }

  if (commandDefinition.getDocumentation) {
    if (!isFunction(commandDefinition.getDocumentation)) {
      throw new errors.CommandDefinitionMalformed(`Property 'getDocumentation' is not a function.`);
    }
  }

  if (commandDefinition.getSchema) {
    if (!isFunction(commandDefinition.getSchema)) {
      throw new errors.CommandDefinitionMalformed(`Property 'getSchema' is not a function.`);
    }
  }
};

export default validateCommandDefinition;
