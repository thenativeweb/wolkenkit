"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startCatchAllServer = void 0;
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const flaschenpost_1 = require("flaschenpost");
const http_1 = __importDefault(require("http"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const startCatchAllServer = async function ({ portOrSocket, onRequest, parseJson = true }) {
    const app = express_1.default();
    app.use(cors_1.default());
    if (parseJson) {
        app.use(body_parser_1.default.json());
    }
    app.all('*', onRequest);
    const server = http_1.default.createServer(app);
    await new Promise((resolve, reject) => {
        try {
            server.on('error', (err) => {
                reject(err);
            });
            server.listen(portOrSocket, () => {
                logger.info('Catch all server started.', { portOrSocket });
                resolve();
            });
        }
        catch (ex) {
            reject(ex);
        }
    });
};
exports.startCatchAllServer = startCatchAllServer;
//# sourceMappingURL=startCatchAllServer.js.map