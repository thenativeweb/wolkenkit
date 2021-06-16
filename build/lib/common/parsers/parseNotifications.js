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
exports.parseNotifications = void 0;
const lodash_1 = require("lodash");
const parseNotificationHandler_1 = require("./parseNotificationHandler");
const defekt_1 = require("defekt");
const errors = __importStar(require("../errors"));
const parseNotifications = function ({ notificationsDefinition }) {
    if (!lodash_1.isObjectLike(notificationsDefinition)) {
        return defekt_1.error(new errors.NotificationsDefinitionMalformed('Notifications definition is not an object.'));
    }
    for (const [notificationHandlerName, notificationHandler] of Object.entries(notificationsDefinition)) {
        const parseResult = parseNotificationHandler_1.parseNotificationHandler({ notificationHandler });
        if (parseResult.hasError()) {
            return defekt_1.error(new errors.NotificationsDefinitionMalformed(`Notification handler '${notificationHandlerName}' is malformed: ${parseResult.error.message}`));
        }
    }
    return defekt_1.value(notificationsDefinition);
};
exports.parseNotifications = parseNotifications;
//# sourceMappingURL=parseNotifications.js.map