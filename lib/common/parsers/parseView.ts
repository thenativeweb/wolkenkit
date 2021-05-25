import { parseNotificationSubscriber } from './parseNotificationSubscriber';
import { parseQueryHandler } from './parseQueryHandler';
import { View } from '../elements/View';
import { error, Result, value } from 'defekt';
import { isArray, isFunction, isObjectLike, isUndefined } from 'lodash';
import * as errors from '../errors';

const parseView = function ({ viewDefinition }: {
  viewDefinition: any;
}): Result<View<any>, errors.ViewDefinitionMalformed> {
  if (!isObjectLike(viewDefinition)) {
    return error(new errors.ViewDefinitionMalformed(`View handler is not an object.`));
  }

  if (isUndefined(viewDefinition.queryHandlers)) {
    return error(new errors.ViewDefinitionMalformed(`Object 'queryHandlers' is missing.`));
  }
  if (!isObjectLike(viewDefinition.queryHandlers)) {
    return error(new errors.ViewDefinitionMalformed(`Property 'queryHandlers' is not an object.`));
  }

  for (const [ queryName, queryHandler ] of Object.entries(viewDefinition.queryHandlers)) {
    const parseResult = parseQueryHandler({ queryHandler });

    if (parseResult.hasError()) {
      return error(new errors.ViewDefinitionMalformed(`Query handler '${queryName}' is malformed: ${parseResult.error.message}`));
    }
  }

  if (!isUndefined(viewDefinition.notificationSubscribers)) {
    if (!isObjectLike(viewDefinition.notificationSubscribers)) {
      return error(new errors.ViewDefinitionMalformed(`Property 'notificationSubscribers' is not an object.`));
    }

    for (const [ notificationSubscriberName, notificationSubscriber ] of Object.entries(viewDefinition.notificationSubscribers)) {
      const parseResult = parseNotificationSubscriber({ notificationSubscriber });

      if (parseResult.hasError()) {
        return error(new errors.ViewDefinitionMalformed(`Notification subscriber '${notificationSubscriberName}' is malformed: ${parseResult.error.message}`));
      }
    }
  }

  if (!isUndefined(viewDefinition.enhancers)) {
    if (!isArray(viewDefinition.enhancers)) {
      return error(new errors.ViewDefinitionMalformed(`Property 'enhancers' is not an array.`));
    }

    for (const [ index, enhancer ] of viewDefinition.enhancers.entries()) {
      if (!isFunction(enhancer)) {
        return error(new errors.ViewDefinitionMalformed(`View enhancer at index '${index}' is not a function.`));
      }
    }
  }

  return value(viewDefinition);
};

export { parseView };
