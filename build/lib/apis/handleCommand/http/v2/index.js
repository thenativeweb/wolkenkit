"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const cancelCommand_1 = require("./cancelCommand");
const getApiBase_1 = require("../../../base/getApiBase");
const getAuthenticationMiddleware_1 = require("../../../base/getAuthenticationMiddleware");
const getDescription_1 = require("./getDescription");
const flaschenpost_1 = require("flaschenpost");
const postCommand_1 = require("./postCommand");
const postCommandWithoutAggregateId_1 = require("./postCommandWithoutAggregateId");
const getV2 = async function ({ corsOrigin, onReceiveCommand, onCancelCommand, application, identityProviders }) {
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
    const authenticationMiddleware = await getAuthenticationMiddleware_1.getAuthenticationMiddleware({
        identityProviders
    });
    api.get(`/${getDescription_1.getDescription.path}`, getDescription_1.getDescription.getHandler({
        application
    }));
    api.post(`/${postCommand_1.postCommand.path}`, authenticationMiddleware, postCommand_1.postCommand.getHandler({
        onReceiveCommand,
        application
    }));
    api.post(`/${postCommandWithoutAggregateId_1.postCommandWithoutAggregateId.path}`, authenticationMiddleware, postCommandWithoutAggregateId_1.postCommandWithoutAggregateId.getHandler({
        onReceiveCommand,
        application
    }));
    api.post(`/${cancelCommand_1.cancelCommand.path}`, authenticationMiddleware, cancelCommand_1.cancelCommand.getHandler({
        onCancelCommand,
        application
    }));
    return { api };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map