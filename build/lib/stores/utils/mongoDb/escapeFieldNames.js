"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.unescapeFieldNames = exports.escapeFieldNames = void 0;
const mapKeysDeep_1 = require("../../../common/utils/mapKeysDeep");
/* eslint-disable quote-props */
const escapeMap = {
    '\\': '\\\\',
    '.': '\\dot',
    '$': '\\dollar'
};
/* eslint-enable quote-props */
const unescapeMap = {
    '\\\\': '\\',
    '\\dot': '.',
    '\\dollar': '$'
};
const escapeFieldNames = function (object) {
    return mapKeysDeep_1.mapKeysDeep(object, (value, key) => key.replace(/[\\.$]/gu, (char) => escapeMap[char]));
};
exports.escapeFieldNames = escapeFieldNames;
const unescapeFieldNames = function (object) {
    return mapKeysDeep_1.mapKeysDeep(object, (value, key) => key.replace(/(?:\\\\|\\dot|\\dollar)/gu, (char) => unescapeMap[char]));
};
exports.unescapeFieldNames = unescapeFieldNames;
//# sourceMappingURL=escapeFieldNames.js.map