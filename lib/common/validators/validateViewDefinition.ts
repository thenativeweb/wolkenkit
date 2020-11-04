import { errors } from '../errors';
import { validateNotificationSubscriber } from './validateNotificationSubscriber';
import { validateQueryHandler } from './validateQueryHandler';
import { isArray, isFunction, isObjectLike, isUndefined } from 'lodash';

const validateViewDefinition = function ({ viewDefinition }: {
  viewDefinition: any;
}): void {
  if (!isObjectLike(viewDefinition)) {
    throw new errors.ViewDefinitionMalformed(`View handler is not an object.`);
  }

  if (isUndefined(viewDefinition.queryHandlers)) {
    throw new errors.ViewDefinitionMalformed(`Object 'queryHandlers' is missing.`);
  }
  if (!isObjectLike(viewDefinition.queryHandlers)) {
    throw new errors.ViewDefinitionMalformed(`Property 'queryHandlers' is not an object.`);
  }

  for (const [ queryName, queryHandler ] of Object.entries(viewDefinition.queryHandlers)) {
    try {
      validateQueryHandler({ queryHandler });
    } catch (ex: unknown) {
      throw new errors.ViewDefinitionMalformed(`Query handler '${queryName}' is malformed: ${(ex as Error).message}`);
    }
  }

  if (!isUndefined(viewDefinition.notificationSubscribers)) {
    if (!isObjectLike(viewDefinition.notificationSubscribers)) {
      throw new errors.ViewDefinitionMalformed(`Property 'notificationSubscribers' is not an object.`);
    }

    for (const [ notificationSubscriberName, notificationSubscriber ] of Object.entries(viewDefinition.notificationSubscribers)) {
      try {
        validateNotificationSubscriber({ notificationSubscriber });
      } catch (ex: unknown) {
        throw new errors.ViewDefinitionMalformed(`Notification subscriber '${notificationSubscriberName}' is malformed: ${(ex as Error).message}`);
      }
    }
  }

  if (!isUndefined(viewDefinition.enhancers)) {
    if (!isArray(viewDefinition.enhancers)) {
      throw new errors.ViewDefinitionMalformed(`Property 'enhancers' is not an array.`);
    }

    for (const [ index, enhancer ] of viewDefinition.enhancers.entries()) {
      if (!isFunction(enhancer)) {
        throw new errors.ViewDefinitionMalformed(`View enhancer at index '${index}' is not a function.`);
      }
    }
  }
};

export { validateViewDefinition };
