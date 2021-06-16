"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const cancelCommand_1 = require("./cancelCommand");
const getApiBase_1 = require("../../../base/getApiBase");
const flaschenpost_1 = require("flaschenpost");
const postCommand_1 = require("./postCommand");
const getV2 = async function ({ corsOrigin, onReceiveCommand, onCancelCommand, application }) {
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
    api.post(`/${postCommand_1.postCommand.path}`, postCommand_1.postCommand.getHandler({
        onReceiveCommand,
        application
    }));
    api.post(`/${cancelCommand_1.cancelCommand.path}`, cancelCommand_1.cancelCommand.getHandler({
        onCancelCommand,
        application
    }));
    return { api };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map