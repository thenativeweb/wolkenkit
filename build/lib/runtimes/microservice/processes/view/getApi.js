"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const get_cors_origin_1 = require("get-cors-origin");
const http_1 = require("../../../../apis/openApi/http");
const http_2 = require("../../../../apis/queryView/http");
const express_1 = __importDefault(require("express"));
const getApi = async function ({ application, configuration, identityProviders }) {
    const corsOrigin = get_cors_origin_1.getCorsOrigin(configuration.viewCorsOrigin);
    const { api: queryViewsApi, getApiDefinitions } = await http_2.getApi({
        corsOrigin,
        application,
        identityProviders
    });
    const api = express_1.default();
    api.use('/views', queryViewsApi);
    if (configuration.enableOpenApiDocumentation) {
        const { api: openApiApi } = await http_1.getApi({
            corsOrigin,
            application,
            title: 'View server API',
            schemes: ['http'],
            apis: [
                ...getApiDefinitions('views')
            ]
        });
        api.use('/open-api', openApiApi);
    }
    return { api };
};
exports.getApi = getApi;
//# sourceMappingURL=getApi.js.map