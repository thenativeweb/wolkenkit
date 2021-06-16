"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.withoutTags = void 0;
const DomainEventWithState_1 = require("../common/elements/DomainEventWithState");
const withoutTags = function (aggregate) {
    const enhancedDomainEventHandlers = {};
    for (const domainEventName of Object.keys(aggregate.domainEventHandlers)) {
        const rawDomainEventHandler = aggregate.domainEventHandlers[domainEventName];
        enhancedDomainEventHandlers[domainEventName] = {
            ...rawDomainEventHandler,
            async map(state, domainEvent, services) {
                let mappedDomainEvent = domainEvent;
                if (rawDomainEventHandler.map) {
                    mappedDomainEvent = await rawDomainEventHandler.map(state, domainEvent, services);
                }
                return new DomainEventWithState_1.DomainEventWithState({
                    ...mappedDomainEvent,
                    metadata: {
                        ...mappedDomainEvent.metadata,
                        tags: []
                    }
                });
            }
        };
    }
    return {
        getInitialState: aggregate.getInitialState,
        commandHandlers: aggregate.commandHandlers,
        enhancers: aggregate.enhancers,
        domainEventHandlers: aggregate.domainEventHandlers
    };
};
exports.withoutTags = withoutTags;
//# sourceMappingURL=withoutTags.js.map