"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHash = void 0;
const crypto_1 = __importDefault(require("crypto"));
const getHash = function ({ value }) {
    const hash = crypto_1.default.createHash('sha256').update(value).digest('hex');
    return hash;
};
exports.getHash = getHash;
//# sourceMappingURL=getHash.js.map