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
exports.validateNotification = void 0;
const validate_value_1 = require("validate-value");
const errors = __importStar(require("../errors"));
const validateNotification = function ({ notification, application }) {
    const notificationDefinitions = application.notifications;
    const { name, data, metadata } = notification;
    if (!(name in notificationDefinitions)) {
        throw new errors.NotificationNotFound(`Notification '${name}' not found.`);
    }
    const { getDataSchema, getMetadataSchema } = notificationDefinitions[name];
    if (getDataSchema) {
        const schema = getDataSchema();
        validate_value_1.parse(data, schema, { valueName: 'notification.data' }).unwrapOrThrow();
    }
    if (getMetadataSchema) {
        const schema = getMetadataSchema();
        validate_value_1.parse(metadata, schema, { valueName: 'notification.metadata' }).unwrapOrThrow();
    }
};
exports.validateNotification = validateNotification;
//# sourceMappingURL=validateNotification.js.map