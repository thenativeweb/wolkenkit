"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEventWithState = void 0;
const DomainEvent_1 = require("./DomainEvent");
class DomainEventWithState extends DomainEvent_1.DomainEvent {
    constructor({ aggregateIdentifier, name, data, id, metadata, state }) {
        super({
            aggregateIdentifier,
            name,
            data,
            id,
            metadata
        });
        this.state = state;
    }
    withoutState() {
        return new DomainEvent_1.DomainEvent(this);
    }
}
exports.DomainEventWithState = DomainEventWithState;
//# sourceMappingURL=DomainEventWithState.js.map