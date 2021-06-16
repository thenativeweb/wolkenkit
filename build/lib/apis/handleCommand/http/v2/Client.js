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
    async getDescription() {
        const { data } = await this.axios({
            method: 'get',
            url: `${this.url}/description`
        });
        return data;
    }
    async postCommand({ command }) {
        const url = command.aggregateIdentifier.aggregate.id ?
            `${this.url}/${command.aggregateIdentifier.context.name}/${command.aggregateIdentifier.aggregate.name}/${command.aggregateIdentifier.aggregate.id}/${command.name}` :
            `${this.url}/${command.aggregateIdentifier.context.name}/${command.aggregateIdentifier.aggregate.name}/${command.name}`;
        const { status, data } = await this.axios({
            method: 'post',
            url,
            data: command.data
        });
        if (status === 200) {
            return {
                id: data.id,
                aggregateIdentifier: {
                    id: data.aggregateIdentifier.aggregate.id
                }
            };
        }
        switch (data.code) {
            case errors.ContextNotFound.code: {
                throw new errors.ContextNotFound(data.message);
            }
            case errors.AggregateNotFound.code: {
                throw new errors.AggregateNotFound(data.message);
            }
            case errors.CommandNotFound.code: {
                throw new errors.CommandNotFound(data.message);
            }
            case errors.CommandMalformed.code: {
                throw new errors.CommandMalformed(data.message);
            }
            default: {
                logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'handleCommand', { error: data, status }));
                throw new errors.UnknownError();
            }
        }
    }
    async cancelCommand({ commandIdentifier }) {
        const { status, data } = await this.axios({
            method: 'post',
            url: `${this.url}/cancel`,
            data: commandIdentifier
        });
        if (status === 200) {
            return;
        }
        switch (data.code) {
            case errors.ContextNotFound.code: {
                throw new errors.ContextNotFound(data.message);
            }
            case errors.AggregateNotFound.code: {
                throw new errors.AggregateNotFound(data.message);
            }
            case errors.CommandNotFound.code: {
                throw new errors.CommandNotFound(data.message);
            }
            case errors.ItemNotFound.code: {
                throw new errors.ItemNotFound(data.message);
            }
            default: {
                logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'handleCommand', { error: data, status }));
                throw new errors.UnknownError();
            }
        }
    }
}
exports.Client = Client;
//# sourceMappingURL=Client.js.map