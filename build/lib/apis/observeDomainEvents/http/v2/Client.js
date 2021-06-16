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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const FilterHeartbeatsTransform_1 = require("../../../../common/utils/http/FilterHeartbeatsTransform");
const flaschenpost_1 = require("flaschenpost");
const HttpClient_1 = require("../../../shared/HttpClient");
const ParseJsonTransform_1 = require("../../../../common/utils/http/ParseJsonTransform");
const stream_to_string_1 = __importDefault(require("stream-to-string"));
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const stream_1 = require("stream");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
class Client extends HttpClient_1.HttpClient {
    constructor({ protocol = 'http', hostName, portOrSocket, path = '/' }) {
        super({ protocol, hostName, portOrSocket, path });
    }
    async getDescription() {
        const { data, status } = await this.axios({
            method: 'get',
            url: `${this.url}/description`
        });
        if (status === 200) {
            return data;
        }
        logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'observeDomainEvents', { error: data, status }));
        throw new errors.UnknownError();
    }
    async getDomainEvents({ filter = {} }) {
        const { data, status } = await this.axios({
            method: 'get',
            url: this.url,
            params: { filter },
            paramsSerializer(params) {
                return Object.entries(params).
                    map(([key, value]) => `${key}=${JSON.stringify(value)}`).
                    join('&');
            },
            responseType: 'stream'
        });
        if (status !== 200) {
            const error = JSON.parse(await stream_to_string_1.default(data));
            logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'observeDomainEvents', { error, status }));
            throw new errors.UnknownError();
        }
        const jsonParser = new ParseJsonTransform_1.ParseJsonTransform();
        const heartbeatFilter = new FilterHeartbeatsTransform_1.FilterHeartbeatsTransform();
        return stream_1.pipeline(data, jsonParser, heartbeatFilter, (err) => {
            if (err) {
                // Do not handle errors explicitly. The returned stream will just close.
                logger.error('An error occured during stream piping.', withLogMetadata_1.withLogMetadata('api-client', 'observeDomainEvents', { err }));
            }
        });
    }
}
exports.Client = Client;
//# sourceMappingURL=Client.js.map