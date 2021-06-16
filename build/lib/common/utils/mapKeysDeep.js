"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapKeysDeep = void 0;
const lodash_1 = require("lodash");
const mapKeysDeep = function (object, map) {
    if (!lodash_1.isPlainObject(object)) {
        return object;
    }
    const mappedObject = {};
    for (const [key, value] of Object.entries(object)) {
        const mappedValue = lodash_1.isPlainObject(value) ? mapKeysDeep(value, map) : value;
        const mappedKey = map(value, key);
        mappedObject[mappedKey] = mappedValue;
    }
    return mappedObject;
};
exports.mapKeysDeep = mapKeysDeep;
//# sourceMappingURL=mapKeysDeep.js.map