"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationDefinition = void 0;
const getCorsSchema_1 = require("../../../shared/schemas/getCorsSchema");
const getPortOrSocketSchema_1 = require("../../../shared/schemas/getPortOrSocketSchema");
const getProtocolSchema_1 = require("../../../shared/schemas/getProtocolSchema");
const path_1 = __importDefault(require("path"));
const corsSchema = getCorsSchema_1.getCorsSchema(), portOrSocketSchema = getPortOrSocketSchema_1.getPortOrSocketSchema(), protocolSchema = getProtocolSchema_1.getProtocolSchema();
const configurationDefinition = {
    aeonstoreHostName: {
        environmentVariable: 'AEONSTORE_HOST_NAME',
        defaultValue: 'aeonstore',
        schema: { type: 'string', format: 'hostname' }
    },
    aeonstorePortOrSocket: {
        environmentVariable: 'AEONSTORE_PORT_OR_SOCKET',
        defaultValue: 3000,
        schema: portOrSocketSchema
    },
    aeonstoreProtocol: {
        environmentVariable: 'AEONSTORE_PROTOCOL',
        defaultValue: 'http',
        schema: protocolSchema
    },
    applicationDirectory: {
        environmentVariable: 'APPLICATION_DIRECTORY',
        defaultValue: path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
        schema: { type: 'string', minLength: 1 }
    },
    corsOrigin: {
        environmentVariable: 'CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
    },
    domainEventDispatcherHostName: {
        environmentVariable: 'DOMAIN_EVENT_DISPATCHER_HOST_NAME',
        defaultValue: 'domain-event-dispatcher',
        schema: { type: 'string', format: 'hostname' }
    },
    domainEventDispatcherPortOrSocket: {
        environmentVariable: 'DOMAIN_EVENT_DISPATCHER_PORT_OR_SOCKET',
        defaultValue: 3000,
        schema: portOrSocketSchema
    },
    domainEventDispatcherProtocol: {
        environmentVariable: 'DOMAIN_EVENT_DISPATCHER_PROTOCOL',
        defaultValue: 'http',
        schema: protocolSchema
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
    portOrSocket: {
        environmentVariable: 'PORT_OR_SOCKET',
        defaultValue: 3000,
        schema: portOrSocketSchema
    }
};
exports.configurationDefinition = configurationDefinition;
//# sourceMappingURL=configurationDefinition.js.map