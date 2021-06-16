"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addMissingPrototype = void 0;
const addMissingPrototype = function ({ value }) {
    if (typeof value !== 'object' || Array.isArray(value)) {
        return value;
    }
    // GraphQL transforms input data into an object without a prototype (i.e. the
    // prototype is set to null), which breaks the option to process these objects
    // in a normal way. While this behavior has been known for years (see PR
    // https://github.com/graphql/graphql-js/pull/504), it is considered to be
    // "by design", so we need to fix this on our own. The simplest and most
    // reliable way to do this is to stringify and parse as JSON.
    return JSON.parse(JSON.stringify(value));
};
exports.addMissingPrototype = addMissingPrototype;
//# sourceMappingURL=addMissingPrototype.js.map