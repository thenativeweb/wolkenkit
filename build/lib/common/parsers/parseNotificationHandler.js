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
exports.parseNotificationHandler = void 0;
const defekt_1 = require("defekt");
const lodash_1 = require("lodash");
const errors = __importStar(require("../errors"));
const parseNotificationHandler = function ({ notificationHandler }) {
    if (!lodash_1.isObjectLike(notificationHandler)) {
        return defekt_1.error(new errors.NotificationHandlerMalformed(`Notification handler is not an object.`));
    }
    if (lodash_1.isUndefined(notificationHandler.isAuthorized)) {
        return defekt_1.error(new errors.NotificationHandlerMalformed(`Function 'isAuthorized' is missing.`));
    }
    if (!lodash_1.isFunction(notificationHandler.isAuthorized)) {
        return defekt_1.error(new errors.NotificationHandlerMalformed(`Property 'isAuthorized' is not a function.`));
    }
    if (!lodash_1.isUndefined(notificationHandler.getDocumentation) && !lodash_1.isFunction(notificationHandler.getDocumentation)) {
        return defekt_1.error(new errors.NotificationHandlerMalformed(`Property 'getDocumentation' is not a function.`));
    }
    if (!lodash_1.isUndefined(notificationHandler.getDataSchema) && !lodash_1.isFunction(notificationHandler.getDataSchema)) {
        return defekt_1.error(new errors.NotificationHandlerMalformed(`Property 'getDataSchema' is not a function.`));
    }
    if (!lodash_1.isUndefined(notificationHandler.getMetadataSchema) && !lodash_1.isFunction(notificationHandler.getMetadataSchema)) {
        return defekt_1.error(new errors.NotificationHandlerMalformed(`Property 'getMetadataSchema' is not a function.`));
    }
    return defekt_1.value(notificationHandler);
};
exports.parseNotificationHandler = parseNotificationHandler;
//# sourceMappingURL=parseNotificationHandler.js.map