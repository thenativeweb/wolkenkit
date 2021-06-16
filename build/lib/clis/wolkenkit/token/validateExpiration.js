"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateExpiration = void 0;
const validateExpiration = function (value) {
    if (value < 1) {
        throw new Error('Expiration must be greater than 0.');
    }
};
exports.validateExpiration = validateExpiration;
//# sourceMappingURL=validateExpiration.js.map