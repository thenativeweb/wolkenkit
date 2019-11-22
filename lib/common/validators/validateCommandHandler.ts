import { errors } from '../errors';
import { isFunction, isObjectLike, isUndefined } from 'lodash';

const validateCommandHandler = function ({ commandHandler }: {
  commandHandler: any;
}): void {
  if (!isObjectLike(commandHandler)) {
    throw new errors.CommandHandlerMalformed(`Property 'commandHandler' is not an object.`);
  }

  if (isUndefined(commandHandler.isAuthorized)) {
    throw new errors.CommandHandlerMalformed(`Function 'isAuthorized' is missing.`);
  }
  if (!isFunction(commandHandler.isAuthorized)) {
    throw new errors.CommandHandlerMalformed(`Property 'isAuthorized' is not a function.`);
  }

  if (isUndefined(commandHandler.handle)) {
    throw new errors.CommandHandlerMalformed(`Function 'handle' is missing.`);
  }
  if (!isFunction(commandHandler.handle)) {
    throw new errors.CommandHandlerMalformed(`Property 'handle' is not a function.`);
  }

  if (commandHandler.getDocumentation) {
    if (!isFunction(commandHandler.getDocumentation)) {
      throw new errors.CommandHandlerMalformed(`Property 'getDocumentation' is not a function.`);
    }
  }

  if (commandHandler.getSchema) {
    if (!isFunction(commandHandler.getSchema)) {
      throw new errors.CommandHandlerMalformed(`Property 'getSchema' is not a function.`);
    }
  }
};

export { validateCommandHandler };
