"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePort = void 0;
const validatePort = function (value) {
    if (value < 0 || value > 65535) {
        throw new Error('Port must be between 0 and 65535.');
    }
};
exports.validatePort = validatePort;
//# sourceMappingURL=validatePort.js.map