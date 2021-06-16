"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationsFieldConfiguration = void 0;
const flaschenpost_1 = require("flaschenpost");
const getApplicationDescription_1 = require("../../../../common/application/getApplicationDescription");
const getClientService_1 = require("../../../../common/services/getClientService");
const get_graphql_from_jsonschema_1 = require("get-graphql-from-jsonschema");
const getLoggerService_1 = require("../../../../common/services/getLoggerService");
const instantiateGraphqlTypeDefinitions_1 = require("../../shared/instantiateGraphqlTypeDefinitions");
const common_tags_1 = require("common-tags");
const validateNotification_1 = require("../../../../common/validators/validateNotification");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const logger = flaschenpost_1.flaschenpost.getLogger();
const getNotificationsFieldConfiguration = function ({ application, notificationEmitter }) {
    var _a;
    const notificationSchemaForGraphQl = {
        type: 'object',
        properties: {
            name: { type: 'string' },
            data: { type: 'string' }
        },
        required: ['name', 'data'],
        additionalProperties: false
    };
    const notificationGraphqlTypeDefinitions = get_graphql_from_jsonschema_1.getGraphqlSchemaFromJsonSchema({
        schema: notificationSchemaForGraphQl,
        rootName: `notification`
    });
    let description = '';
    const applicationDescription = getApplicationDescription_1.getApplicationDescription({ application });
    for (const [notificationName, notificationDescription] of Object.entries(applicationDescription.notifications)) {
        description += common_tags_1.source `
      # Notification '${notificationName}'

      ${(_a = notificationDescription.documentation) !== null && _a !== void 0 ? _a : 'No documentation available.'}

          ${notificationDescription.dataSchema ? JSON.stringify(notificationDescription.dataSchema, null, 2) : 'No schema available.'}
    `;
        description += '\n';
    }
    return {
        type: instantiateGraphqlTypeDefinitions_1.instantiateGraphqlTypeDefinitions(notificationGraphqlTypeDefinitions),
        description,
        async *subscribe(innerSource, args, { clientMetadata }) {
            const clientService = getClientService_1.getClientService({ clientMetadata });
            for await (const [notification] of notificationEmitter) {
                try {
                    validateNotification_1.validateNotification({ notification, application });
                }
                catch {
                    logger.warn('Dropped invalid notification.', withLogMetadata_1.withLogMetadata('api', 'graphql', { notification }));
                    continue;
                }
                const notificationHandler = application.notifications[notification.name];
                if (!notificationHandler.isAuthorized(notification.data, notification.metadata, {
                    logger: getLoggerService_1.getLoggerService({
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
        resolve(notification) {
            return notification;
        }
    };
};
exports.getNotificationsFieldConfiguration = getNotificationsFieldConfiguration;
//# sourceMappingURL=getNotificationsFieldConfiguration.js.map