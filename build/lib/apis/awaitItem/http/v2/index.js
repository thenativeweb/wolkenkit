"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const acknowledge_1 = require("./acknowledge");
const awaitItem_1 = require("./awaitItem");
const defer_1 = require("./defer");
const getApiBase_1 = require("../../../base/getApiBase");
const flaschenpost_1 = require("flaschenpost");
const renewLock_1 = require("./renewLock");
const getV2 = async function ({ corsOrigin, priorityQueueStore, newItemSubscriber, newItemSubscriberChannel, validateOutgoingItem, heartbeatInterval = 90000 }) {
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
    api.get(`/${awaitItem_1.awaitItem.path}`, flaschenpost_1.getMiddleware({ logOn: 'request' }), awaitItem_1.awaitItem.getHandler({
        priorityQueueStore,
        newItemSubscriber,
        newItemSubscriberChannel,
        validateOutgoingItem,
        heartbeatInterval
    }));
    const loggingMiddleware = flaschenpost_1.getMiddleware();
    api.post(`/${renewLock_1.renewLock.path}`, loggingMiddleware, renewLock_1.renewLock.getHandler({
        priorityQueueStore
    }));
    api.post(`/${acknowledge_1.acknowledge.path}`, loggingMiddleware, acknowledge_1.acknowledge.getHandler({
        priorityQueueStore
    }));
    api.post(`/${defer_1.defer.path}`, loggingMiddleware, defer_1.defer.getHandler({
        priorityQueueStore
    }));
    return { api };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map