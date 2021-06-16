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
exports.prepareForPublication = void 0;
const filterDomainEvent_1 = require("./filterDomainEvent");
const flaschenpost_1 = require("flaschenpost");
const isDomainEventAuthorized_1 = require("./isDomainEventAuthorized");
const mapDomainEvent_1 = require("./mapDomainEvent");
const partof_1 = require("partof");
const withLogMetadata_1 = require("../../utils/logging/withLogMetadata");
const errors = __importStar(require("../../errors"));
const logger = flaschenpost_1.flaschenpost.getLogger();
const prepareForPublication = async function ({ domainEventWithState, domainEventFilter, application, repository, services }) {
    if (!partof_1.partOf(domainEventFilter, domainEventWithState)) {
        return;
    }
    const { aggregateIdentifier: { context: { name: contextName }, aggregate: { name: aggregateName } }, name: domainEventName } = domainEventWithState;
    const { aggregateIdentifier } = domainEventWithState;
    const aggregateInstance = await repository.getAggregateInstance({
        aggregateIdentifier
    });
    const aggregateState = aggregateInstance.state;
    const domainEventHandler = application.domain[contextName][aggregateName].domainEventHandlers[domainEventName];
    try {
        await isDomainEventAuthorized_1.isDomainEventAuthorized({ domainEventWithState, aggregateState, domainEventHandler, services });
        await filterDomainEvent_1.filterDomainEvent({ domainEventWithState, aggregateState, domainEventHandler, services });
        const mappedDomainEvent = await mapDomainEvent_1.mapDomainEvent({ domainEventWithState, aggregateState, domainEventHandler, services });
        const domainEvent = mappedDomainEvent.withoutState();
        return domainEvent;
    }
    catch (ex) {
        switch (ex.code) {
            case errors.DomainEventNotAuthorized.code:
            case errors.DomainEventRejected.code:
                // Ignore these exceptions, as this is usual control flow in this case,
                // which means that we simply don't want the domain event to be served.
                // Hence, we return nothing here.
                return;
            default:
                // In case of an actual error, we don't want the runtime to crash. So we
                // only log that something went wrong and hinder that the domain event
                // gets served.
                logger.error('Preparing domain event for publication failed.', withLogMetadata_1.withLogMetadata('common', 'prepareForPublication', { error: ex }));
        }
    }
};
exports.prepareForPublication = prepareForPublication;
//# sourceMappingURL=prepareForPublication.js.map