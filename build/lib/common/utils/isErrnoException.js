"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isErrnoException = void 0;
const isErrnoException = function (error) {
    return typeof error === 'object' && error !== null && 'code' in error;
};
exports.isErrnoException = isErrnoException;
//# sourceMappingURL=isErrnoException.js.map