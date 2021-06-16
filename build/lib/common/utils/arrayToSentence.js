"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arrayToSentence = void 0;
const getFormat = function ({ itemPrefix, itemSuffix }) {
    return function (item) {
        return `${itemPrefix}${item}${itemSuffix}`;
    };
};
const arrayToSentence = function ({ data, conjunction, itemPrefix = '', itemSuffix = '' }) {
    const format = getFormat({ itemPrefix, itemSuffix });
    if (data.length === 0) {
        return '';
    }
    if (data.length === 1) {
        return format(data[0]);
    }
    if (data.length === 2) {
        return `${format(data[0])} ${conjunction} ${format(data[1])}`;
    }
    return `${data.slice(0, -1).map((item) => format(item)).join(', ')}, ${conjunction} ${format(data.slice(-1))}`;
};
exports.arrayToSentence = arrayToSentence;
//# sourceMappingURL=arrayToSentence.js.map