"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.doesItemIdentifierWithClientMatchCommandWithMetadata = void 0;
const lodash_1 = require("lodash");
const doesItemIdentifierWithClientMatchCommandWithMetadata = function ({ item, itemIdentifier }) {
    return lodash_1.isEqual(item.aggregateIdentifier, itemIdentifier.aggregateIdentifier) &&
        item.name === itemIdentifier.name &&
        item.id === itemIdentifier.id &&
        lodash_1.isEqual(item.metadata.client.user, itemIdentifier.client.user);
};
exports.doesItemIdentifierWithClientMatchCommandWithMetadata = doesItemIdentifierWithClientMatchCommandWithMetadata;
//# sourceMappingURL=doesItemIdentifierWithClientMatchCommandWithMetadata.js.map