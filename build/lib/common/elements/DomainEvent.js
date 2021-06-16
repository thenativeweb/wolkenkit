"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DomainEvent = void 0;
class DomainEvent {
    constructor({ aggregateIdentifier, name, data, id, metadata }) {
        this.aggregateIdentifier = aggregateIdentifier;
        this.name = name;
        this.data = data;
        this.id = id;
        this.metadata = metadata;
    }
    getItemIdentifier() {
        return {
            aggregateIdentifier: this.aggregateIdentifier,
            name: this.name,
            id: this.id
        };
    }
    getFullyQualifiedName() {
        return `${this.aggregateIdentifier.context.name}.${this.aggregateIdentifier.aggregate.name}.${this.name}`;
    }
}
exports.DomainEvent = DomainEvent;
//# sourceMappingURL=DomainEvent.js.map