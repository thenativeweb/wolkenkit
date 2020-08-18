import { Application } from '../../../../common/application/Application';
import { flaschenpost } from 'flaschenpost';
import { getClientService } from '../../../../common/services/getClientService';
import { getGraphqlFromJsonSchema } from 'get-graphql-from-jsonschema';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { Notification } from '../../../../common/elements/Notification';
import { ResolverContext } from '../ResolverContext';
import { Schema } from '../../../../common/elements/Schema';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { validateNotification } from '../../../../common/validators/validateNotification';
import { buildSchema, GraphQLFieldConfig, GraphQLObjectType } from 'graphql';

const logger = flaschenpost.getLogger();

const getNotificationsFieldConfiguration = function ({ application, notificationEmitter }: {
  application: Application;
  notificationEmitter: SpecializedEventEmitter<Notification>;
}): GraphQLFieldConfig<any, ResolverContext> {
  const notificationSchemaForGraphQl: Schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      data: { type: 'string' }
    },
    required: [ 'name', 'data' ]
  };

  const notificationGraphQL = getGraphqlFromJsonSchema({
    schema: notificationSchemaForGraphQl,
    rootName: `notification`
  });

  return {
    type: buildSchema(notificationGraphQL.typeDefinitions.join('\n')).getType(notificationGraphQL.typeName) as GraphQLObjectType,
    async * subscribe (
      _source,
      _args,
      { clientMetadata }: ResolverContext
    ): AsyncIterator<Notification> {
      const clientService = getClientService({ clientMetadata });

      for await (const [ notification ] of notificationEmitter) {
        try {
          validateNotification({ notification, application });
        } catch (ex) {
          logger.warn('Dropping invalid notification.', { notification });

          continue;
        }

        const notificationHandler = application.notifications[notification.name];

        if (!notificationHandler.isAuthorized(notification.data, notification.metadata, {
          logger: getLoggerService({
            fileName: `<app>/server/notifications/${notification.name}`,
            packageManifest: application.packageManifest
          }),
          infrastructure: application.infrastructure,
          client: clientService
        })) {
          continue;
        }

        const notificationForPublic = {
          name: notification.name,
          data: JSON.stringify(notification.data)
        };

        yield notificationForPublic;
      }
    },
    resolve (notification): any {
      return notification;
    }
  };
};

export { getNotificationsFieldConfiguration };
