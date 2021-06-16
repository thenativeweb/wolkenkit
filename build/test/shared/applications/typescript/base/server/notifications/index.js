"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const complexNotificationHandler_1 = require("./handlers/complexNotificationHandler");
const flowSampleFlowUpdatedNotificationHandler_1 = require("./handlers/flowSampleFlowUpdatedNotificationHandler");
const viewSampleViewUpdatedNotificationHandler_1 = require("./handlers/viewSampleViewUpdatedNotificationHandler");
const notifications = {
    complex: complexNotificationHandler_1.complexNotificationHandler,
    flowSampleFlowUpdated: flowSampleFlowUpdatedNotificationHandler_1.flowSampleFlowUpdatedNotificationHandler,
    viewSampleViewUpdated: viewSampleViewUpdatedNotificationHandler_1.viewSampleViewUpdatedNotificationHandler
};
exports.default = notifications;
//# sourceMappingURL=index.js.map