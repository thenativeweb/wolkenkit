"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriptionSchema = void 0;
const getNotificationsFieldConfiguration_1 = require("./getNotificationsFieldConfiguration");
const SpecializedEventEmitter_1 = require("../../../../common/utils/events/SpecializedEventEmitter");
const getSubscriptionSchema = async function ({ application, subscriber, channelForNotifications }) {
    const notificationEmitter = new SpecializedEventEmitter_1.SpecializedEventEmitter();
    await subscriber.subscribe({
        channel: channelForNotifications,
        callback(notification) {
            notificationEmitter.emit(notification);
        }
    });
    return getNotificationsFieldConfiguration_1.getNotificationsFieldConfiguration({
        application,
        notificationEmitter
    });
};
exports.getSubscriptionSchema = getSubscriptionSchema;
//# sourceMappingURL=getSubscriptionSchema.js.map