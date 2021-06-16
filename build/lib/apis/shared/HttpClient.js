"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpClient = void 0;
const axios_1 = __importDefault(require("axios"));
const validateStatus = function () {
    return true;
};
class HttpClient {
    constructor({ protocol = 'http', hostName, portOrSocket, path = '/' }) {
        const url = typeof portOrSocket === 'number' ?
            `${protocol}://${hostName}:${portOrSocket}${path}` :
            `${protocol}://${hostName}${path}`;
        this.url = url.endsWith('/') ? url.slice(0, -1) : url;
        this.axios = typeof portOrSocket === 'number' ?
            axios_1.default.create({
                validateStatus
            }) :
            axios_1.default.create({
                socketPath: portOrSocket,
                validateStatus
            });
    }
}
exports.HttpClient = HttpClient;
//# sourceMappingURL=HttpClient.js.map