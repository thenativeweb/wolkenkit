"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const get_cors_origin_1 = require("get-cors-origin");
const http_1 = require("../../../../apis/subscribeNotifications/http");
const express_1 = __importDefault(require("express"));
const getApi = async function ({ configuration, application, identityProviders, subscriber, channelForNotifications }) {
    const corsOrigin = get_cors_origin_1.getCorsOrigin(configuration.notificationCorsOrigin);
    const api = express_1.default();
    const { api: subscribeNotificationsApi } = await http_1.getApi({
        application,
        identityProviders,
        subscriber,
        channelForNotifications,
        corsOrigin,
        heartbeatInterval: configuration.heartbeatInterval
    });
    api.use('/notifications', subscribeNotificationsApi);
    return { api };
};
exports.getApi = getApi;
//# sourceMappingURL=getApi.js.map