import { InfrastructureDefinition } from '../application/InfrastructureDefinition';
import { error, Result, value } from 'defekt';
import { isFunction, isObjectLike, isUndefined } from 'lodash';
import * as errors from '../errors';

const parseInfrastructureDefinition = function ({ infrastructureDefinition }: {
  infrastructureDefinition: any;
}): Result<InfrastructureDefinition<any, any>, errors.InfrastructureDefinitionMalformed> {
  if (!isObjectLike(infrastructureDefinition)) {
    return error(new errors.InfrastructureDefinitionMalformed('Infrastructure definition is not an object.'));
  }

  if (isUndefined(infrastructureDefinition.setupInfrastructure)) {
    return error(new errors.InfrastructureDefinitionMalformed(`Function 'setupInfrastructure' is missing.`));
  }
  if (!isFunction(infrastructureDefinition.setupInfrastructure)) {
    return error(new errors.InfrastructureDefinitionMalformed(`Property 'setupInfrastructure' is not a function.`));
  }

  if (isUndefined(infrastructureDefinition.getInfrastructure)) {
    return error(new errors.InfrastructureDefinitionMalformed(`Function 'getInfrastructure' is missing.`));
  }
  if (!isFunction(infrastructureDefinition.getInfrastructure)) {
    return error(new errors.InfrastructureDefinitionMalformed(`Property 'getInfrastructure' is not a function.`));
  }

  return value(infrastructureDefinition);
};

export { parseInfrastructureDefinition };
