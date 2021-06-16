"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const getApiBase_1 = require("../../../base/getApiBase");
const flaschenpost_1 = require("flaschenpost");
const postDomainEvent_1 = require("./postDomainEvent");
const getV2 = async function ({ corsOrigin, onReceiveDomainEvent, application }) {
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
    api.post(`/${postDomainEvent_1.postDomainEvent.path}`, postDomainEvent_1.postDomainEvent.getHandler({
        onReceiveDomainEvent,
        application
    }));
    return { api };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map