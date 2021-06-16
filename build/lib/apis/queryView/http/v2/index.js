"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const getApiBase_1 = require("../../../base/getApiBase");
const getAuthenticationMiddleware_1 = require("../../../base/getAuthenticationMiddleware");
const getDescription_1 = require("./getDescription");
const getMiddleware_1 = require("flaschenpost/build/lib/middleware/getMiddleware");
const queryStream_1 = require("./queryStream");
const queryValue_1 = require("./queryValue");
const getV2 = async function ({ application, corsOrigin, identityProviders }) {
    const api = await getApiBase_1.getApiBase({
        request: {
            headers: { cors: { origin: corsOrigin } },
            body: { parser: { sizeLimit: 100000 } },
            query: { parser: { useJson: true } }
        },
        response: {
            headers: { cache: false }
        }
    });
    const loggingOnResponseMiddleware = getMiddleware_1.getMiddleware();
    const loggingOnRequestMiddleware = getMiddleware_1.getMiddleware({ logOn: 'request' });
    const authenticationMiddleware = await getAuthenticationMiddleware_1.getAuthenticationMiddleware({
        identityProviders
    });
    api.get(`/${getDescription_1.getDescription.path}`, loggingOnResponseMiddleware, getDescription_1.getDescription.getHandler({
        application
    }));
    api.get(`/${queryStream_1.queryStream.path}`, loggingOnRequestMiddleware, authenticationMiddleware, queryStream_1.queryStream.getHandler({
        application
    }));
    api.get(`/${queryValue_1.queryValue.path}`, loggingOnResponseMiddleware, authenticationMiddleware, queryValue_1.queryValue.getHandler({
        application
    }));
    return { api };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map