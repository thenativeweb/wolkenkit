"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runHealthServer = void 0;
const express_1 = __importDefault(require("express"));
const flaschenpost_1 = require("flaschenpost");
const http_1 = require("../../apis/getHealth/http");
const get_cors_origin_1 = require("get-cors-origin");
const http_2 = __importDefault(require("http"));
const withLogMetadata_1 = require("../../common/utils/logging/withLogMetadata");
const logger = flaschenpost_1.flaschenpost.getLogger();
const runHealthServer = async function ({ corsOrigin, portOrSocket }) {
    const app = express_1.default();
    const { api } = await http_1.getApi({
        corsOrigin: get_cors_origin_1.getCorsOrigin(corsOrigin)
    });
    app.use('/health', api);
    const server = http_2.default.createServer(app);
    return new Promise((resolve) => {
        server.listen(portOrSocket, () => {
            logger.info('Started health server.', withLogMetadata_1.withLogMetadata('runtime', 'shared/health', { healthPortOrSocket: portOrSocket }));
            resolve();
        });
    });
};
exports.runHealthServer = runHealthServer;
//# sourceMappingURL=runHealthServer.js.map