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
exports.getAggregateService = void 0;
const DomainEvent_1 = require("../elements/DomainEvent");
const DomainEventWithState_1 = require("../elements/DomainEventWithState");
const validate_value_1 = require("validate-value");
const uuid_1 = require("uuid");
const lodash_1 = require("lodash");
const errors = __importStar(require("../errors"));
const getAggregateService = function ({ aggregateInstance, application, command }) {
    return {
        id() {
            return aggregateInstance.aggregateIdentifier.aggregate.id;
        },
        isPristine() {
            return aggregateInstance.isPristine();
        },
        publishDomainEvent(domainEventName, data, 
        // eslint-disable-next-line unicorn/no-object-as-default-parameter
        metadata = { tags: [] }) {
            const contextName = aggregateInstance.aggregateIdentifier.context.name;
            const aggregateName = aggregateInstance.aggregateIdentifier.aggregate.name;
            const domainEventHandler = lodash_1.get(application.domain, [contextName, aggregateName, 'domainEventHandlers', domainEventName]);
            if (!domainEventHandler) {
                throw new errors.DomainEventUnknown(`Failed to publish unknown domain event '${domainEventName}' in '${contextName}.${aggregateName}'.`);
            }
            if (domainEventHandler.getSchema) {
                const schema = domainEventHandler.getSchema();
                validate_value_1.parse(data, schema, { valueName: 'data' }).unwrapOrThrow();
            }
            const domainEvent = new DomainEvent_1.DomainEvent({
                aggregateIdentifier: aggregateInstance.aggregateIdentifier,
                name: domainEventName,
                data,
                id: uuid_1.v4(),
                metadata: {
                    causationId: command.id,
                    correlationId: command.metadata.correlationId,
                    timestamp: Date.now(),
                    initiator: command.metadata.initiator,
                    revision: aggregateInstance.revision + aggregateInstance.unstoredDomainEvents.length + 1,
                    tags: metadata.tags
                }
            });
            const previousState = lodash_1.cloneDeep(aggregateInstance.state);
            const nextState = aggregateInstance.applyDomainEvent({ application, domainEvent });
            const domainEventWithState = new DomainEventWithState_1.DomainEventWithState({
                ...domainEvent,
                state: {
                    previous: previousState,
                    next: nextState
                }
            });
            aggregateInstance.unstoredDomainEvents.push(domainEventWithState);
            return nextState;
        }
    };
};
exports.getAggregateService = getAggregateService;
//# sourceMappingURL=getAggregateService.js.map