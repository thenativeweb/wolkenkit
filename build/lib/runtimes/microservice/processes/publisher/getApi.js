"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const get_cors_origin_1 = require("get-cors-origin");
const http_1 = require("../../../../apis/publishMessage/http");
const http_2 = require("../../../../apis/subscribeMessages/http");
const express_1 = __importDefault(require("express"));
const getApi = async function ({ configuration, onReceiveMessage }) {
    const { api: publishMessageApi } = await http_1.getApi({
        corsOrigin: get_cors_origin_1.getCorsOrigin(configuration.publishCorsOrigin),
        onReceiveMessage
    });
    const { api: subscribeMessagesApi, publishMessage } = await http_2.getApi({
        corsOrigin: get_cors_origin_1.getCorsOrigin(configuration.subscribeCorsOrigin)
    });
    const api = express_1.default();
    api.use('/publish', publishMessageApi);
    api.use('/subscribe', subscribeMessagesApi);
    return { api, publishMessage };
};
exports.getApi = getApi;
//# sourceMappingURL=getApi.js.map