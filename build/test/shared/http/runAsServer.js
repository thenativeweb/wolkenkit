"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAsServer = void 0;
const getSocketPaths_1 = require("../getSocketPaths");
const http_1 = __importDefault(require("http"));
const axios_1 = __importDefault(require("axios"));
const runAsServer = async function ({ app }) {
    const server = http_1.default.createServer(app);
    const [socket] = await getSocketPaths_1.getSocketPaths({ count: 1 });
    await new Promise((resolve, reject) => {
        server.listen(socket, () => {
            resolve();
        });
        server.on('error', (err) => {
            reject(err);
        });
    });
    const axiosInstance = axios_1.default.create({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        baseURL: `http://localhost`,
        socketPath: socket
    });
    return { client: axiosInstance, socket };
};
exports.runAsServer = runAsServer;
//# sourceMappingURL=runAsServer.js.map