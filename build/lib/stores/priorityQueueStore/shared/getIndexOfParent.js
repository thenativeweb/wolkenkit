"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIndexOfParent = void 0;
const getIndexOfParent = function ({ index }) {
    const isLeftChild = index % 2 === 1;
    if (isLeftChild) {
        return (index - 1) / 2;
    }
    return (index - 2) / 2;
};
exports.getIndexOfParent = getIndexOfParent;
//# sourceMappingURL=getIndexOfParent.js.map