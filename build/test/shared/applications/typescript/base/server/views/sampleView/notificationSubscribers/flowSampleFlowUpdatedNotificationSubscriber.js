"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flowSampleFlowUpdatedNotificationSubscriber = void 0;
const flowSampleFlowUpdatedNotificationSubscriber = {
    isRelevant({ name }) {
        return name === 'flowSampleFlowUpdated';
    },
    handle(data, { notification }) {
        notification.publish('viewSampleViewUpdated', {});
    }
};
exports.flowSampleFlowUpdatedNotificationSubscriber = flowSampleFlowUpdatedNotificationSubscriber;
//# sourceMappingURL=flowSampleFlowUpdatedNotificationSubscriber.js.map