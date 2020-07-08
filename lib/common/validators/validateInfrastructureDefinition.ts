import { errors } from '../errors';
import { isFunction, isObjectLike, isUndefined } from 'lodash';

const validateInfrastructureDefinition = function ({ infrastructureDefinition }: {
  infrastructureDefinition: any;
}): void {
  if (!isObjectLike(infrastructureDefinition)) {
    throw new errors.InfrastructureDefinitionMalformed('Infrastructure definition is not an object.');
  }

  if (isUndefined(infrastructureDefinition.setupInfrastructure)) {
    throw new errors.InfrastructureDefinitionMalformed(`Function 'setupInfrastructure' is missing.`);
  }
  if (!isFunction(infrastructureDefinition.setupInfrastructure)) {
    throw new errors.InfrastructureDefinitionMalformed(`Property 'setupInfrastructure' is not a function.`);
  }

  if (isUndefined(infrastructureDefinition.getInfrastructure)) {
    throw new errors.InfrastructureDefinitionMalformed(`Function 'getInfrastructure' is missing.`);
  }
  if (!isFunction(infrastructureDefinition.getInfrastructure)) {
    throw new errors.InfrastructureDefinitionMalformed(`Property 'getInfrastructure' is not a function.`);
  }
};

export { validateInfrastructureDefinition };
