"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMode = void 0;
const arrayToSentence_1 = require("../../../../common/utils/arrayToSentence");
const modes = ['error', 'warn'];
const validateMode = function (value) {
    if (!modes.includes(value)) {
        throw new Error(`Invalid mode '${value}', must be ${arrayToSentence_1.arrayToSentence({
            data: modes,
            conjunction: 'or',
            itemPrefix: `'`,
            itemSuffix: `'`
        })}.`);
    }
};
exports.validateMode = validateMode;
//# sourceMappingURL=validateMode.js.map