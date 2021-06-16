"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.acknowledgeDomainEvent = void 0;
const acknowledgeDomainEvent = async function ({ flowName, token, priorityQueue }) {
    await priorityQueue.store.acknowledge({
        discriminator: flowName,
        token
    });
};
exports.acknowledgeDomainEvent = acknowledgeDomainEvent;
//# sourceMappingURL=acknowledgeDomainEvent.js.map