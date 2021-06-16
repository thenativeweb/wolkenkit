"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSocket = void 0;
const validateSocket = function (value) {
    if (value.length === 0) {
        throw new Error('Socket must not be an empty string.');
    }
};
exports.validateSocket = validateSocket;
//# sourceMappingURL=validateSocket.js.map