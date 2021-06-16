"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateLanguage = void 0;
const arrayToSentence_1 = require("../../../common/utils/arrayToSentence");
const languages_1 = require("./languages");
const languageIds = languages_1.languages.map((language) => language.id);
const validateLanguage = function (value) {
    if (!languageIds.includes(value)) {
        throw new Error(`Invalid language '${value}', must be ${arrayToSentence_1.arrayToSentence({
            data: languageIds,
            conjunction: 'or',
            itemPrefix: `'`,
            itemSuffix: `'`
        })}.`);
    }
};
exports.validateLanguage = validateLanguage;
//# sourceMappingURL=validateLanguage.js.map