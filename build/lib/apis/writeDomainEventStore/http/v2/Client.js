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
    async storeDomainEvents({ domainEvents }) {
        const { status, data } = await this.axios({
            method: 'post',
            url: `${this.url}/store-domain-events`,
            data: domainEvents
        });
        if (status === 200) {
            return;
        }
        switch (data.code) {
            case errors.DomainEventMalformed.code: {
                throw new errors.DomainEventMalformed(data.message);
            }
            case errors.ParameterInvalid.code: {
                throw new errors.ParameterInvalid(data.message);
            }
            case errors.RevisionAlreadyExists.code: {
                throw new errors.RevisionAlreadyExists(data.message);
            }
            default: {
                logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'writeDomainEventStore', { error: data, status }));
                throw new errors.UnknownError(data.message);
            }
        }
    }
    async storeSnapshot({ snapshot }) {
        const { status, data } = await this.axios({
            method: 'post',
            url: `${this.url}/store-snapshot`,
            data: snapshot
        });
        if (status === 200) {
            return;
        }
        switch (data.code) {
            case errors.RequestMalformed.code: {
                throw new errors.RequestMalformed(data.message);
            }
            case errors.SnapshotMalformed.code: {
                throw new errors.SnapshotMalformed(data.message);
            }
            default: {
                logger.error('An unknown error occured.', withLogMetadata_1.withLogMetadata('api-client', 'writeDomainEventStore', { error: data, status }));
                throw new errors.UnknownError(data.message);
            }
        }
    }
}
exports.Client = Client;
//# sourceMappingURL=Client.js.map