"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const eventemitter2_1 = require("eventemitter2");
const getApiBase_1 = require("../../../base/getApiBase");
const flaschenpost_1 = require("flaschenpost");
const getMessages_1 = require("./getMessages");
const getV2 = async function ({ corsOrigin, heartbeatInterval = 90000 }) {
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
    api.use(flaschenpost_1.getMiddleware({ logOn: 'request' }));
    const messageEmitter = new eventemitter2_1.EventEmitter2({
        wildcard: true
    });
    api.get(`/${getMessages_1.getMessages.path}`, getMessages_1.getMessages.getHandler({
        messageEmitter,
        heartbeatInterval
    }));
    const publishMessage = function ({ channel, message }) {
        messageEmitter.emit(channel, message);
    };
    return { api, publishMessage };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map