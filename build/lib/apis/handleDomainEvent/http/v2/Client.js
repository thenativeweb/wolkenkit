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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const flaschenpost_1 = require("flaschenpost");
const HttpClient_1 = require("../../../shared/HttpClient");
const withLogMetadata_1 = require("../../../../common/utils/logging/withLogMetadata");
const errors = __importStar(require("../../../../common/errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
class Client extends HttpClient_1.HttpClient {
    constructor({ protocol = 'http', hostName, portOrSocket, path = '/' }) {
        super({ protocol, hostName, portOrSocket, path });
    }
    async postDomainEvent({ flowNames, domainEvent }) {
        const { status, data } = await this.axios({
            method: 'post',
            url: `${this.url}/`,
            data: { flowNames, domainEvent }
        });
        if (status === 200) {
            return;
        }
        switch (data.code) {
            case errors.FlowNotFound.code: {
                throw new errors.FlowNotFound(data.message);
            }
            case errors.ContextNotFound.code: {
                throw new errors.ContextNotFound(data.message);
            }
            case errors.AggregateNotFound.code: {
                throw new errors.AggregateNotFound(data.message);
            }
            case errors.DomainEventNotFound.code: {
                throw new errors.DomainEventNotFound(data.message);
            }
            case errors.DomainEventMalformed.code: {
                throw new errors.DomainEventMalformed(data.message);
            }
            default: {
                logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'handleDomainEvent', { error: data, status }));
                throw new errors.UnknownError();
            }
        }
    }
}
exports.Client = Client;
//# sourceMappingURL=Client.js.map