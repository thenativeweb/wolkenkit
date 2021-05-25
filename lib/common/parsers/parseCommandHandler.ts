import { CommandHandler } from '../../wolkenkit';
import { error, Result, value } from 'defekt';
import { isFunction, isObjectLike, isUndefined } from 'lodash';
import * as errors from '../errors';

const parseCommandHandler = function ({ commandHandler }: {
  commandHandler: any;
}): Result<CommandHandler<any, any, any>, errors.CommandHandlerMalformed> {
  if (!isObjectLike(commandHandler)) {
    return error(new errors.CommandHandlerMalformed(`Property 'commandHandler' is not an object.`));
  }

  if (isUndefined(commandHandler.isAuthorized)) {
    return error(new errors.CommandHandlerMalformed(`Function 'isAuthorized' is missing.`));
  }
  if (!isFunction(commandHandler.isAuthorized)) {
    return error(new errors.CommandHandlerMalformed(`Property 'isAuthorized' is not a function.`));
  }

  if (isUndefined(commandHandler.handle)) {
    return error(new errors.CommandHandlerMalformed(`Function 'handle' is missing.`));
  }
  if (!isFunction(commandHandler.handle)) {
    return error(new errors.CommandHandlerMalformed(`Property 'handle' is not a function.`));
  }

  if (!isUndefined(commandHandler.getDocumentation) && !isFunction(commandHandler.getDocumentation)) {
    return error(new errors.CommandHandlerMalformed(`Property 'getDocumentation' is not a function.`));
  }

  if (!isUndefined(commandHandler.getSchema) && !isFunction(commandHandler.getSchema)) {
    return error(new errors.CommandHandlerMalformed(`Property 'getSchema' is not a function.`));
  }

  return value(commandHandler);
};

export { parseCommandHandler };
