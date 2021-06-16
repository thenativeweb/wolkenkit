"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNotificationService = void 0;
const validateNotification_1 = require("../validators/validateNotification");
const getNotificationService = function ({ application, channel, publisher }) {
    return {
        async publish(name, data, metadata) {
            const notification = {
                name,
                data,
                metadata
            };
            validateNotification_1.validateNotification({ notification, application });
            await publisher.publish({
                channel,
                message: notification
            });
        }
    };
};
exports.getNotificationService = getNotificationService;
//# sourceMappingURL=getNotificationService.js.map