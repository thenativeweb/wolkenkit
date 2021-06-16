"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const getApiBase_1 = require("../../../base/getApiBase");
const flaschenpost_1 = require("flaschenpost");
const postPerformReplay_1 = require("./postPerformReplay");
const getV2 = async function ({ corsOrigin, performReplay, application }) {
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
    api.post(`/${postPerformReplay_1.postPerformReplay.path}`, postPerformReplay_1.postPerformReplay.getHandler({
        performReplay,
        application
    }));
    return { api };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map