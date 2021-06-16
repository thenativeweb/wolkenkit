"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationDefinition = void 0;
const getCorsSchema_1 = require("../../../shared/schemas/getCorsSchema");
const getHeartbeatIntervalSchema_1 = require("../../../shared/schemas/getHeartbeatIntervalSchema");
const getIdentityProviderSchema_1 = require("../../../shared/schemas/getIdentityProviderSchema");
const getPortOrSocketSchema_1 = require("../../../shared/schemas/getPortOrSocketSchema");
const getSubscriberOptionsSchema_1 = require("../../../shared/schemas/getSubscriberOptionsSchema");
const path_1 = __importDefault(require("path"));
const corsSchema = getCorsSchema_1.getCorsSchema(), heartbeatIntervalSchema = getHeartbeatIntervalSchema_1.getHeartbeatIntervalSchema(), identityProviderSchema = getIdentityProviderSchema_1.getIdentityProviderSchema(), portOrSocketSchema = getPortOrSocketSchema_1.getPortOrSocketSchema();
const configurationDefinition = {
    applicationDirectory: {
        environmentVariable: 'APPLICATION_DIRECTORY',
        defaultValue: path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
        schema: { type: 'string', minLength: 1 }
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
    heartbeatInterval: {
        environmentVariable: 'HEARTBEAT_INTERVAL',
        defaultValue: 90000,
        schema: heartbeatIntervalSchema
    },
    identityProviders: {
        environmentVariable: 'IDENTITY_PROVIDERS',
        defaultValue: [{
                issuer: 'https://token.invalid',
                certificate: path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io')
            }],
        schema: identityProviderSchema
    },
    notificationCorsOrigin: {
        environmentVariable: 'SUBSCRIBE_CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
    },
    portOrSocket: {
        environmentVariable: 'PORT_OR_SOCKET',
        defaultValue: 3000,
        schema: portOrSocketSchema
    },
    pubSubOptions: {
        environmentVariable: 'PUB_SUB_OPTIONS',
        defaultValue: {
            channelForNotifications: 'notifications',
            subscriber: { type: 'InMemory' }
        },
        schema: {
            type: 'object',
            properties: {
                channelForNotifications: { type: 'string', minLength: 1 },
                subscriber: getSubscriberOptionsSchema_1.getSubscriberOptionsSchema()
            },
            required: ['channelForNotifications', 'subscriber'],
            additionalProperties: false
        }
    }
};
exports.configurationDefinition = configurationDefinition;
//# sourceMappingURL=configurationDefinition.js.map