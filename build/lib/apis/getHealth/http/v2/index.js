"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const getApiBase_1 = require("../../../base/getApiBase");
const getHealth_1 = require("./getHealth");
const flaschenpost_1 = require("flaschenpost");
const getV2 = async function ({ corsOrigin }) {
    const api = await getApiBase_1.getApiBase({
        request: {
            headers: { cors: { origin: corsOrigin } },
            body: { parser: false },
            query: { parser: { useJson: false } }
        },
        response: {
            headers: { cache: false }
        }
    });
    api.get(`/${getHealth_1.getHealth.path}`, flaschenpost_1.getMiddleware(), getHealth_1.getHealth.getHandler());
    return { api };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map