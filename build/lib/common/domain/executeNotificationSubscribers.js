"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeNotificationSubscribers = void 0;
const flaschenpost_1 = require("flaschenpost");
const withLogMetadata_1 = require("../utils/logging/withLogMetadata");
const errors = __importStar(require("../errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const executeNotificationSubscribers = async function ({ application, notification, viewName, services }) {
    if (!(viewName in application.views)) {
        throw new errors.ViewNotFound(`View '${viewName}' not found.`);
    }
    const viewDefinition = application.views[viewName];
    if (!viewDefinition.notificationSubscribers) {
        return;
    }
    for (const [notificationSubscriberName, notificationSubscriber] of Object.entries(viewDefinition.notificationSubscribers)) {
        if (!notificationSubscriber.isRelevant({ name: notification.name })) {
            continue;
        }
        try {
            await notificationSubscriber.handle(notification.data, {
                ...services,
                infrastructure: application.infrastructure
            });
        }
        catch (ex) {
            logger.error(`A notification subscriber threw an error.`, withLogMetadata_1.withLogMetadata('common', 'executeNotificationSubscriber', { error: ex, viewName, notificationSubscriberName }));
            throw ex;
        }
    }
};
exports.executeNotificationSubscribers = executeNotificationSubscribers;
//# sourceMappingURL=executeNotificationSubscribers.js.map