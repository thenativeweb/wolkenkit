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
exports.validateDomainEventWithState = void 0;
const validate_value_1 = require("validate-value");
const errors = __importStar(require("../errors"));
const validateDomainEventWithState = function ({ domainEvent, application }) {
    const contextDefinitions = application.domain;
    const { aggregateIdentifier: { context: { name: contextName }, aggregate: { name: aggregateName } }, name: domainEventName, data: domainEventData } = domainEvent;
    if (!(contextName in contextDefinitions)) {
        throw new errors.ContextNotFound(`Context '${contextName}' not found.`);
    }
    if (!(aggregateName in contextDefinitions[contextName])) {
        throw new errors.AggregateNotFound(`Aggregate '${contextName}.${aggregateName}' not found.`);
    }
    if (!(domainEventName in contextDefinitions[contextName][aggregateName].domainEventHandlers)) {
        throw new errors.DomainEventNotFound(`Domain event '${contextName}.${aggregateName}.${domainEventName}' not found.`);
    }
    const domainEventHandler = contextDefinitions[contextName][aggregateName].domainEventHandlers[domainEventName];
    if (!domainEventHandler.getSchema) {
        return;
    }
    validate_value_1.parse(domainEventData, domainEventHandler.getSchema(), { valueName: 'domainEvent.data' }).unwrapOrThrow((err) => new errors.DomainEventMalformed({ message: err.message, cause: err }));
};
exports.validateDomainEventWithState = validateDomainEventWithState;
//# sourceMappingURL=validateDomainEventWithState.js.map