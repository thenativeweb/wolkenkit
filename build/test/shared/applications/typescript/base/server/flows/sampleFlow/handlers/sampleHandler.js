"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sampleHandler = void 0;
exports.sampleHandler = {
    isRelevant({ fullyQualifiedName }) {
        return fullyQualifiedName === 'sampleContext.sampleAggregate.executed';
    },
    handle(domainEvent, { infrastructure, logger, notification }) {
        logger.info('Received domain event.', { domainEvent });
        infrastructure.tell.viewStore.domainEvents.push(domainEvent);
        notification.publish('flowSampleFlowUpdated', {});
    }
};
//# sourceMappingURL=sampleHandler.js.map