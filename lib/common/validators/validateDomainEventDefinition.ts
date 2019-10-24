import { errors } from '../errors';
import { isFunction, isObject, isUndefined } from 'lodash';

const validateDomainEventDefinition = function ({ domainEventDefinition }: {
  domainEventDefinition: any;
}): void {
  if (isUndefined(domainEventDefinition.handle)) {
    throw new errors.DomainEventDefinitionMalformed(`Function 'handle' is missing.`);
  }
  if (!isFunction(domainEventDefinition.handle)) {
    throw new errors.DomainEventDefinitionMalformed(`Property 'handle' is not a function.`);
  }

  if (isUndefined(domainEventDefinition.isAuthorized)) {
    throw new errors.DomainEventDefinitionMalformed(`Function 'isAuthorized' is missing.`);
  }
  if (!isFunction(domainEventDefinition.isAuthorized)) {
    throw new errors.DomainEventDefinitionMalformed(`Property 'isAuthorized' is not a function.`);
  }

  if (domainEventDefinition.getDocumentation) {
    if (!isFunction(domainEventDefinition.getDocumentation)) {
      throw new errors.DomainEventDefinitionMalformed(`Property 'getDocumentation' is not a function.`);
    }
  }

  if (domainEventDefinition.getSchema) {
    if (!isObject(domainEventDefinition.getSchema)) {
      throw new errors.DomainEventDefinitionMalformed(`Property 'getSchema' is not a function.`);
    }
  }

  if (domainEventDefinition.filter) {
    if (!isFunction(domainEventDefinition.filter)) {
      throw new errors.DomainEventDefinitionMalformed(`Property 'filter' is not a function.`);
    }
  }

  if (domainEventDefinition.map) {
    if (!isFunction(domainEventDefinition.map)) {
      throw new errors.DomainEventDefinitionMalformed(`Property 'map' is not a function.`);
    }
  }
};

export { validateDomainEventDefinition };
