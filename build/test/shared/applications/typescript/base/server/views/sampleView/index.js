"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const all_1 = require("./queries/all");
const flowSampleFlowUpdatedNotificationSubscriber_1 = require("./notificationSubscribers/flowSampleFlowUpdatedNotificationSubscriber");
const sampleView = {
    queryHandlers: {
        all: all_1.all
    },
    notificationSubscribers: {
        flowSampleFlowUpdatedNotificationSubscriber: flowSampleFlowUpdatedNotificationSubscriber_1.flowSampleFlowUpdatedNotificationSubscriber
    }
};
exports.default = sampleView;
//# sourceMappingURL=index.js.map