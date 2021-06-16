"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const getApiBase_1 = require("../../../base/getApiBase");
const flaschenpost_1 = require("flaschenpost");
const storeDomainEvents_1 = require("./storeDomainEvents");
const storeSnapshot_1 = require("./storeSnapshot");
const getV2 = async function ({ domainEventStore, corsOrigin }) {
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
    api.use(flaschenpost_1.getMiddleware());
    api.post(`/${storeDomainEvents_1.storeDomainEvents.path}`, storeDomainEvents_1.storeDomainEvents.getHandler({ domainEventStore }));
    api.post(`/${storeSnapshot_1.storeSnapshot.path}`, storeSnapshot_1.storeSnapshot.getHandler({ domainEventStore }));
    return { api };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map