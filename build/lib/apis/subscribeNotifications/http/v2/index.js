"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const getApiBase_1 = require("../../../base/getApiBase");
const getAuthenticationMiddleware_1 = require("../../../base/getAuthenticationMiddleware");
const getDescription_1 = require("./getDescription");
const flaschenpost_1 = require("flaschenpost");
const getNotifications_1 = require("./getNotifications");
const getV2 = async function ({ application, corsOrigin, identityProviders, subscriber, channelForNotifications, heartbeatInterval }) {
    const api = await getApiBase_1.getApiBase({
        request: {
            headers: { cors: { origin: corsOrigin } },
            body: { parser: false },
            query: { parser: { useJson: true } }
        },
        response: {
            headers: { cache: false }
        }
    });
    const authenticationMiddleware = await getAuthenticationMiddleware_1.getAuthenticationMiddleware({
        identityProviders
    });
    api.get(`/${getDescription_1.getDescription.path}`, flaschenpost_1.getMiddleware(), getDescription_1.getDescription.getHandler({
        application
    }));
    api.get(`/${getNotifications_1.getNotifications.path}`, flaschenpost_1.getMiddleware({ logOn: 'request' }), authenticationMiddleware, getNotifications_1.getNotifications.getHandler({
        application,
        subscriber,
        channelForNotifications,
        heartbeatInterval
    }));
    return { api };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map