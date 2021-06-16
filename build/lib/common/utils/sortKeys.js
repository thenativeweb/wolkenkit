"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sortKeys = void 0;
const sortKeys = function ({ object, recursive = false }) {
    if (typeof object !== 'object' || Array.isArray(object)) {
        return object;
    }
    return Object.
        keys(object).
        sort((left, right) => left.localeCompare(right)).
        reduce((acc, key) => {
        let value = object[key];
        if (recursive && typeof value === 'object' && !Array.isArray(value)) {
            value = sortKeys({
                object: value,
                recursive
            });
        }
        return { ...acc, [key]: value };
    }, {});
};
exports.sortKeys = sortKeys;
//# sourceMappingURL=sortKeys.js.map