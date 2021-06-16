"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapDomainEvent = void 0;
const lodash_1 = require("lodash");
const mapDomainEvent = async function ({ domainEventWithState, aggregateState, domainEventHandler, services }) {
    /* eslint-disable @typescript-eslint/unbound-method */
    if (!domainEventHandler.map) {
        return domainEventWithState;
    }
    /* eslint-enable @typescript-eslint/unbound-method */
    const clonedDomainEvent = lodash_1.cloneDeep(domainEventWithState);
    const mappedDomainEvent = await domainEventHandler.map(aggregateState, clonedDomainEvent, services);
    return mappedDomainEvent;
};
exports.mapDomainEvent = mapDomainEvent;
//# sourceMappingURL=mapDomainEvent.js.map