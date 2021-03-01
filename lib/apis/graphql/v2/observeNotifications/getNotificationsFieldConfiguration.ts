import { Application } from '../../../../common/application/Application';
import { flaschenpost } from 'flaschenpost';
import { getApplicationDescription } from '../../../../common/application/getApplicationDescription';
import { getClientService } from '../../../../common/services/getClientService';
import { getGraphqlFromJsonSchema } from 'get-graphql-from-jsonschema';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { Notification } from '../../../../common/elements/Notification';
import { ResolverContext } from '../ResolverContext';
import { Schema } from '../../../../common/elements/Schema';
import { source } from 'common-tags';
import { SpecializedEventEmitter } from '../../../../common/utils/events/SpecializedEventEmitter';
import { validateNotification } from '../../../../common/validators/validateNotification';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
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

  const notificationGraphQl = getGraphqlFromJsonSchema({
    schema: notificationSchemaForGraphQl,
    rootName: `notification`
  });

  let description = '';
  const applicationDescription = getApplicationDescription({ application });

  for (const [ notificationName, notificationDescription ] of Object.entries(applicationDescription.notifications)) {
    description += source`
      # Notification '${notificationName}'

      ${notificationDescription.documentation ?? 'No documentation available.'}

          ${notificationDescription.dataSchema ? JSON.stringify(notificationDescription.dataSchema, null, 2) : 'No schema available.'}
    `;
    description += '\n';
  }

  return {
    type: buildSchema(notificationGraphQl.typeDefinitions.join('\n')).getType(notificationGraphQl.typeName) as GraphQLObjectType,
    description,
    async * subscribe (
      innerSource,
      args,
      { clientMetadata }: ResolverContext
    ): AsyncIterator<Notification> {
      const clientService = getClientService({ clientMetadata });

      for await (const [ notification ] of notificationEmitter) {
        try {
          validateNotification({ notification, application });
        } catch {
          logger.warn(
            'Dropped invalid notification.',
            withLogMetadata('api', 'graphql', { notification })
          );

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
