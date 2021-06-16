"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesItemIdentifierWithClientMatchDomainEvent = void 0;
const lodash_1 = require("lodash");
const doesItemIdentifierWithClientMatchDomainEvent = function ({ item, itemIdentifier }) {
    return lodash_1.isEqual(item.aggregateIdentifier, itemIdentifier.aggregateIdentifier) &&
        item.name === itemIdentifier.name &&
        item.id === itemIdentifier.id &&
        lodash_1.isEqual(item.metadata.initiator.user, itemIdentifier.client.user);
};
exports.doesItemIdentifierWithClientMatchDomainEvent = doesItemIdentifierWithClientMatchDomainEvent;
//# sourceMappingURL=doesItemIdentifierWithClientMatchDomainEvent.js.map