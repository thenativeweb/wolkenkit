"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTemplate = void 0;
const arrayToSentence_1 = require("../../../common/utils/arrayToSentence");
const templates_1 = require("./templates");
const templateIds = templates_1.templates.map((template) => template.id);
const validateTemplate = function (value) {
    if (!templateIds.includes(value)) {
        throw new Error(`Invalid template '${value}', must be ${arrayToSentence_1.arrayToSentence({
            data: templateIds,
            conjunction: 'or',
            itemPrefix: `'`,
            itemSuffix: `'`
        })}.`);
    }
};
exports.validateTemplate = validateTemplate;
//# sourceMappingURL=validateTemplate.js.map