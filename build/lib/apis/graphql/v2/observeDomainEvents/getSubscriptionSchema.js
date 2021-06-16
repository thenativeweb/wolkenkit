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
exports.getSubscriptionSchema = void 0;
const getDomainEventsFieldConfiguration_1 = require("./getDomainEventsFieldConfiguration");
const getDomainEventWithStateSchema_1 = require("../../../../common/schemas/getDomainEventWithStateSchema");
const validate_value_1 = require("validate-value");
const SpecializedEventEmitter_1 = require("../../../../common/utils/events/SpecializedEventEmitter");
const validateDomainEventWithState_1 = require("../../../../common/validators/validateDomainEventWithState");
const errors = __importStar(require("../../../../common/errors"));
const domainEventWithStateSchema = new validate_value_1.Parser(getDomainEventWithStateSchema_1.getDomainEventWithStateSchema());
const getSubscriptionSchema = function ({ application, repository }) {
    const domainEventEmitter = new SpecializedEventEmitter_1.SpecializedEventEmitter();
    const publishDomainEvent = function ({ domainEvent }) {
        domainEventWithStateSchema.parse(domainEvent, { valueName: 'domainEvent' }).unwrapOrThrow((err) => new errors.DomainEventMalformed(err.message));
        validateDomainEventWithState_1.validateDomainEventWithState({ domainEvent, application });
        domainEventEmitter.emit(domainEvent);
    };
    const schema = getDomainEventsFieldConfiguration_1.getDomainEventsFieldConfiguration({
        application,
        repository,
        domainEventEmitter
    });
    return {
        schema,
        publishDomainEvent
    };
};
exports.getSubscriptionSchema = getSubscriptionSchema;
//# sourceMappingURL=getSubscriptionSchema.js.map