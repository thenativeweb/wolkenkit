"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationDefinition = void 0;
const getCorsSchema_1 = require("../../../shared/schemas/getCorsSchema");
const getFileStoreOptionsSchema_1 = require("../../../shared/schemas/getFileStoreOptionsSchema");
const getIdentityProviderSchema_1 = require("../../../shared/schemas/getIdentityProviderSchema");
const getPortOrSocketSchema_1 = require("../../../shared/schemas/getPortOrSocketSchema");
const path_1 = __importDefault(require("path"));
const corsSchema = getCorsSchema_1.getCorsSchema(), fileStoreOptionsSchema = getFileStoreOptionsSchema_1.getFileStoreOptionsSchema(), identityProviderSchema = getIdentityProviderSchema_1.getIdentityProviderSchema(), portOrSocketSchema = getPortOrSocketSchema_1.getPortOrSocketSchema();
const configurationDefinition = {
    applicationDirectory: {
        environmentVariable: 'APPLICATION_DIRECTORY',
        defaultValue: path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
        schema: {
            type: 'string',
            minLength: 1
        }
    },
    fileCorsOrigin: {
        environmentVariable: 'FILE_CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
    },
    fileStoreOptions: {
        environmentVariable: 'FILE_STORE_OPTIONS',
        defaultValue: { type: 'InMemory' },
        schema: fileStoreOptionsSchema
    },
    enableOpenApiDocumentation: {
        environmentVariable: 'ENABLE_OPEN_API_DOCUMENTATION',
        defaultValue: false,
        schema: { type: 'boolean' }
    },
    healthCorsOrigin: {
        environmentVariable: 'HEALTH_CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
    },
    healthPortOrSocket: {
        environmentVariable: 'HEALTH_PORT_OR_SOCKET',
        defaultValue: 3001,
        schema: portOrSocketSchema
    },
    identityProviders: {
        environmentVariable: 'IDENTITY_PROVIDERS',
        defaultValue: [{
                issuer: 'https://token.invalid',
                certificate: path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io')
            }],
        schema: identityProviderSchema
    },
    portOrSocket: {
        environmentVariable: 'PORT_OR_SOCKET',
        defaultValue: 3000,
        schema: portOrSocketSchema
    }
};
exports.configurationDefinition = configurationDefinition;
//# sourceMappingURL=configurationDefinition.js.map