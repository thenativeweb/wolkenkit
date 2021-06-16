"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getV2 = void 0;
const getApiBase_1 = require("../../../base/getApiBase");
const getAuthenticationMiddleware_1 = require("../../../base/getAuthenticationMiddleware");
const getDescription_1 = require("./getDescription");
const getDomainEvents_1 = require("./getDomainEvents");
const getDomainEventWithStateSchema_1 = require("../../../../common/schemas/getDomainEventWithStateSchema");
const flaschenpost_1 = require("flaschenpost");
const validate_value_1 = require("validate-value");
const SpecializedEventEmitter_1 = require("../../../../common/utils/events/SpecializedEventEmitter");
const validateDomainEventWithState_1 = require("../../../../common/validators/validateDomainEventWithState");
const errors = __importStar(require("../../../../common/errors"));
const domainEventWithStateParser = new validate_value_1.Parser(getDomainEventWithStateSchema_1.getDomainEventWithStateSchema());
const getV2 = async function ({ corsOrigin, application, repository, identityProviders, heartbeatInterval }) {
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
    const domainEventEmitter = new SpecializedEventEmitter_1.SpecializedEventEmitter();
    api.get(`/${getDescription_1.getDescription.path}`, flaschenpost_1.getMiddleware(), getDescription_1.getDescription.getHandler({
        application
    }));
    api.get(`/${getDomainEvents_1.getDomainEvents.path}`, flaschenpost_1.getMiddleware({ logOn: 'request' }), authenticationMiddleware, getDomainEvents_1.getDomainEvents.getHandler({
        application,
        domainEventEmitter,
        repository,
        heartbeatInterval
    }));
    const publishDomainEvent = function ({ domainEvent }) {
        domainEventWithStateParser.parse(domainEvent, { valueName: 'domainEvent' }).unwrapOrThrow((err) => new errors.DomainEventMalformed(err.message));
        validateDomainEventWithState_1.validateDomainEventWithState({ domainEvent, application });
        domainEventEmitter.emit(domainEvent);
    };
    return { api, publishDomainEvent };
};
exports.getV2 = getV2;
//# sourceMappingURL=index.js.map