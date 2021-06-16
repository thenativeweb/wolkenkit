"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const get_cors_origin_1 = require("get-cors-origin");
const http_1 = require("../../../../apis/performReplay/http");
const express_1 = __importDefault(require("express"));
const getApi = async function ({ configuration, application, performReplay }) {
    const corsOrigin = get_cors_origin_1.getCorsOrigin(configuration.corsOrigin);
    const { api: performReplayApi } = await http_1.getApi({
        corsOrigin,
        performReplay,
        application
    });
    const api = express_1.default();
    api.use('/perform-replay', performReplayApi);
    return { api };
};
exports.getApi = getApi;
//# sourceMappingURL=getApi.js.map