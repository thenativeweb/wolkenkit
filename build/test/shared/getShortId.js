"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getShortId = void 0;
const lodash_1 = require("lodash");
const characters = 'abcdefghijklmnopqrstuvwxyz', digits = '0123456789';
const getShortId = function () {
    const alphabet = `${characters}${characters.toUpperCase()}${digits}`;
    let shuffledAlphabet;
    do {
        shuffledAlphabet = lodash_1.shuffle(alphabet.split('')).join('');
    } while (digits.includes(shuffledAlphabet[0]));
    const shortId = shuffledAlphabet.slice(0, 8);
    return shortId;
};
exports.getShortId = getShortId;
//# sourceMappingURL=getShortId.js.map