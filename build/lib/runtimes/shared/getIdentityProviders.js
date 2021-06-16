"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIdentityProviders = void 0;
const fs_1 = __importDefault(require("fs"));
const limes_1 = require("limes");
const path_1 = __importDefault(require("path"));
const getIdentityProviders = async function ({ identityProvidersEnvironmentVariable }) {
    const identityProviders = [];
    for (const identityProviderDescription of identityProvidersEnvironmentVariable) {
        const { issuer, certificate: certificateDirectory } = identityProviderDescription;
        const certificatePath = path_1.default.join(certificateDirectory, 'certificate.pem');
        const certificate = await fs_1.default.promises.readFile(certificatePath);
        const identityProvider = new limes_1.IdentityProvider({
            issuer,
            certificate
        });
        identityProviders.push(identityProvider);
    }
    return identityProviders;
};
exports.getIdentityProviders = getIdentityProviders;
//# sourceMappingURL=getIdentityProviders.js.map