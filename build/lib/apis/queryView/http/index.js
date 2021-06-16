"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApi = void 0;
const getApiDefinitions_1 = require("./getApiDefinitions");
const v2_1 = require("./v2");
const express_1 = __importDefault(require("express"));
const getApi = async function ({ application, corsOrigin, identityProviders }) {
    const api = express_1.default();
    const v2 = await v2_1.getV2({
        application,
        corsOrigin,
        identityProviders
    });
    api.use('/v2', v2.api);
    return {
        api,
        getApiDefinitions: (basePath) => getApiDefinitions_1.getApiDefinitions({ application, basePath })
    };
};
exports.getApi = getApi;
//# sourceMappingURL=index.js.map