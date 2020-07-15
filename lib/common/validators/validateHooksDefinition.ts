import { errors } from '../errors';
import { isFunction, isObjectLike, isUndefined } from 'lodash';

const validateHooksDefinition = function ({ hooksDefinition }: {
  hooksDefinition: any;
}): void {
  if (!isObjectLike(hooksDefinition)) {
    throw new errors.HooksDefinitionMalformed('Hooks definition is not an object.');
  }

  if (!isUndefined(hooksDefinition.apis)) {
    if (!isObjectLike(hooksDefinition.apis)) {
      throw new errors.HooksDefinitionMalformed(`Property 'apis' is not an object.`);
    }

    if (!isUndefined(hooksDefinition.apis.manageFile)) {
      if (!isObjectLike(hooksDefinition.apis.manageFile)) {
        throw new errors.HooksDefinitionMalformed(`Property 'apis.manageFile' is not an object.`);
      }

      if (!isUndefined(hooksDefinition.apis.manageFile.addingFile)) {
        if (!isFunction(hooksDefinition.apis.manageFile.addingFile)) {
          throw new errors.HooksDefinitionMalformed(`Property 'apis.manageFile.addingFile' is not a function.`);
        }
      }

      if (!isUndefined(hooksDefinition.apis.manageFile.addedFile)) {
        if (!isFunction(hooksDefinition.apis.manageFile.addedFile)) {
          throw new errors.HooksDefinitionMalformed(`Property 'apis.manageFile.addedFile' is not a function.`);
        }
      }
    }
  }
};

export { validateHooksDefinition };
