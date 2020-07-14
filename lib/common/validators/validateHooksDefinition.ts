import { errors } from '../errors';
import { isFunction, isObjectLike } from 'lodash';

const validateHooksDefinition = function ({ hooksDefinition }: {
  hooksDefinition: any;
}): void {
  if (!isObjectLike(hooksDefinition)) {
    throw new errors.HooksDefinitionMalformed('Hooks definition is not an object.');
  }

  if (hooksDefinition.apis) {
    if (!isObjectLike(hooksDefinition.apis)) {
      throw new errors.HooksDefinitionMalformed(`Property 'apis' is not an object.`);
    }

    if (hooksDefinition.apis.getFile) {
      if (!isObjectLike(hooksDefinition.apis.getFile)) {
        throw new errors.HooksDefinitionMalformed(`Property 'apis.getFile' is not an object.`);
      }

      if (hooksDefinition.apis.getFile.addingFile) {
        if (!isFunction(hooksDefinition.apis.getFile.addingFile)) {
          throw new errors.HooksDefinitionMalformed(`Property 'apis.getFile.addingFile' is not a function.`);
        }
      }

      if (hooksDefinition.apis.getFile.addedFile) {
        if (!isFunction(hooksDefinition.apis.getFile.addedFile)) {
          throw new errors.HooksDefinitionMalformed(`Property 'apis.getFile.addedFile' is not a function.`);
        }
      }
    }
  }
};

export { validateHooksDefinition };
