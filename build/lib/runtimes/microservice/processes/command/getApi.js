"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const flaschenpost_1 = require("flaschenpost");
const get_cors_origin_1 = require("get-cors-origin");
const http_1 = require("../../../../apis/handleCommand/http");
const http_2 = require("../../../../apis/openApi/http");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const express_1 = __importDefault(require("express"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const getApi = async function ({ configuration, application, identityProviders, onReceiveCommand, onCancelCommand }) {
    const corsOrigin = get_cors_origin_1.getCorsOrigin(configuration.commandCorsOrigin);
    const { api: handleCommandApi, getApiDefinitions: getHandleCommandApiDefinitions } = await http_1.getApi({
        corsOrigin,
        onReceiveCommand,
        onCancelCommand,
        application,
        identityProviders
    });
    const api = express_1.default();
    api.use('/command', handleCommandApi);
    if (configuration.enableOpenApiDocumentation) {
        logger.info('Open api endpoint is enabled.', withLogMetadata_1.withLogMetadata('runtime', 'microservice/command'));
        const { api: openApiApi } = await http_2.getApi({
            corsOrigin,
            application,
            title: 'Command server API',
            schemes: ['http'],
            apis: [
                ...getHandleCommandApiDefinitions('command')
            ]
        });
        api.use('/open-api', openApiApi);
    }
    return { api };
};
exports.getApi = getApi;
//# sourceMappingURL=getApi.js.map