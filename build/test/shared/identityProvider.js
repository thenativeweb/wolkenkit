"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.identityProvider = void 0;
const fs_1 = __importDefault(require("fs"));
const limes_1 = require("limes");
const path_1 = __importDefault(require("path"));
/* eslint-disable no-sync */
const identityProvider = new limes_1.IdentityProvider({
    issuer: 'https://auth.thenativeweb.io',
    privateKey: fs_1.default.readFileSync(path_1.default.join(__dirname, 'keys', 'localhost', 'privateKey.pem')),
    certificate: fs_1.default.readFileSync(path_1.default.join(__dirname, 'keys', 'localhost', 'certificate.pem'))
});
exports.identityProvider = identityProvider;
//# sourceMappingURL=identityProvider.js.map