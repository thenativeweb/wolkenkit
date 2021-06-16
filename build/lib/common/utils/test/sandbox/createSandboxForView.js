"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSandboxForView = void 0;
const createPublisher_1 = require("../../../../messaging/pubSub/createPublisher");
const executeNotificationSubscribers_1 = require("../../../domain/executeNotificationSubscribers");
const executeStreamQueryHandler_1 = require("../../../domain/executeStreamQueryHandler");
const getClientService_1 = require("../../../services/getClientService");
const getLoggerService_1 = require("../../../services/getLoggerService");
const getNotificationService_1 = require("../../../services/getNotificationService");
const createSandboxForView = function (sandboxConfiguration) {
    return {
        async query({ queryName, queryOptions, clientMetadata }) {
            var _a, _b;
            const clientServiceFactory = (_a = sandboxConfiguration.clientServiceFactory) !== null && _a !== void 0 ? _a : getClientService_1.getClientService, loggerServiceFactory = (_b = sandboxConfiguration.loggerServiceFactory) !== null && _b !== void 0 ? _b : getLoggerService_1.getLoggerService;
            return await executeStreamQueryHandler_1.executeStreamQueryHandler({
                application: sandboxConfiguration.application,
                queryHandlerIdentifier: {
                    view: { name: sandboxConfiguration.viewName },
                    name: queryName
                },
                services: {
                    client: clientServiceFactory({ clientMetadata: clientMetadata !== null && clientMetadata !== void 0 ? clientMetadata : {
                            ip: '127.0.0.1',
                            user: { id: 'jane.doe', claims: { sub: 'jane.doe' } },
                            token: '...'
                        } }),
                    logger: loggerServiceFactory({
                        packageManifest: sandboxConfiguration.application.packageManifest,
                        fileName: `<app>/server/views/${sandboxConfiguration.viewName}/queries/${queryName}`
                    })
                },
                options: queryOptions !== null && queryOptions !== void 0 ? queryOptions : {}
            });
        },
        async notify({ notification }) {
            var _a, _b, _c;
            const loggerServiceFactory = (_a = sandboxConfiguration.loggerServiceFactory) !== null && _a !== void 0 ? _a : getLoggerService_1.getLoggerService, notificationServiceFactory = (_b = sandboxConfiguration.notificationServiceFactory) !== null && _b !== void 0 ? _b : getNotificationService_1.getNotificationService, publisher = (_c = sandboxConfiguration.publisher) !== null && _c !== void 0 ? _c : await createPublisher_1.createPublisher({ type: 'InMemory' });
            for (const viewName of Object.keys(sandboxConfiguration.application.views)) {
                await executeNotificationSubscribers_1.executeNotificationSubscribers({
                    application: sandboxConfiguration.application,
                    viewName,
                    notification,
                    services: {
                        logger: loggerServiceFactory({
                            packageManifest: sandboxConfiguration.application.packageManifest,
                            fileName: `<app>/server/views/${sandboxConfiguration.viewName}/notificationSubscribers`
                        }),
                        notification: notificationServiceFactory({
                            application: sandboxConfiguration.application,
                            publisher,
                            channel: 'notifications'
                        })
                    }
                });
            }
        }
    };
};
exports.createSandboxForView = createSandboxForView;
//# sourceMappingURL=createSandboxForView.js.map