import { Hooks } from '../elements/Hooks';
import { error, Result, value } from 'defekt';
import { isFunction, isObjectLike, isUndefined } from 'lodash';
import * as errors from '../errors';

const parseHooks = function ({ hooksDefinition }: {
  hooksDefinition: any;
}): Result<Hooks<any>, errors.HooksDefinitionMalformed> {
  if (!isObjectLike(hooksDefinition)) {
    return error(new errors.HooksDefinitionMalformed('Hooks definition is not an object.'));
  }

  if (!isUndefined(hooksDefinition.addingFile) && !isFunction(hooksDefinition.addingFile)) {
    return error(new errors.HooksDefinitionMalformed(`Property 'addingFile' is not a function.`));
  }

  if (!isUndefined(hooksDefinition.addedFile) && !isFunction(hooksDefinition.addedFile)) {
    return error(new errors.HooksDefinitionMalformed(`Property 'addedFile' is not a function.`));
  }

  if (!isUndefined(hooksDefinition.gettingFile) && !isFunction(hooksDefinition.gettingFile)) {
    return error(new errors.HooksDefinitionMalformed(`Property 'gettingFile' is not a function.`));
  }

  if (!isUndefined(hooksDefinition.gotFile) && !isFunction(hooksDefinition.gotFile)) {
    return error(new errors.HooksDefinitionMalformed(`Property 'gotFile' is not a function.`));
  }

  if (!isUndefined(hooksDefinition.removingFile) && !isFunction(hooksDefinition.removingFile)) {
    return error(new errors.HooksDefinitionMalformed(`Property 'removingFile' is not a function.`));
  }

  if (!isUndefined(hooksDefinition.removedFile) && !isFunction(hooksDefinition.removedFile)) {
    return error(new errors.HooksDefinitionMalformed(`Property 'removedFile' is not a function.`));
  }

  return value(hooksDefinition);
};

export { parseHooks };
