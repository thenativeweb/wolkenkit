"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const getApiDefinitions_1 = require("./getApiDefinitions");
const v2_1 = require("./v2");
const express_1 = __importDefault(require("express"));
const getApi = async function ({ corsOrigin, application, repository, identityProviders, heartbeatInterval }) {
    const api = express_1.default();
    const v2 = await v2_1.getV2({
        corsOrigin,
        application,
        repository,
        identityProviders,
        heartbeatInterval
    });
    api.use('/v2', v2.api);
    const publishDomainEvent = function ({ domainEvent }) {
        v2.publishDomainEvent({ domainEvent });
    };
    return {
        api,
        publishDomainEvent,
        getApiDefinitions: (basePath) => getApiDefinitions_1.getApiDefinitions({ basePath })
    };
};
exports.getApi = getApi;
//# sourceMappingURL=index.js.map