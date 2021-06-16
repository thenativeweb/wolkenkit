"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationDefinition = void 0;
const getCorsSchema_1 = require("../../../shared/schemas/getCorsSchema");
const getIdentityProviderSchema_1 = require("../../../shared/schemas/getIdentityProviderSchema");
const getPortOrSocketSchema_1 = require("../../../shared/schemas/getPortOrSocketSchema");
const getProtocolSchema_1 = require("../../../shared/schemas/getProtocolSchema");
const getPublisherOptionsSchema_1 = require("../../../shared/schemas/getPublisherOptionsSchema");
const getSnapshotStrategySchema_1 = require("../../../shared/schemas/getSnapshotStrategySchema");
const getSubscriberOptionsSchema_1 = require("../../../shared/schemas/getSubscriberOptionsSchema");
const path_1 = __importDefault(require("path"));
const corsSchema = getCorsSchema_1.getCorsSchema(), identityProviderSchema = getIdentityProviderSchema_1.getIdentityProviderSchema(), portOrSocketSchema = getPortOrSocketSchema_1.getPortOrSocketSchema(), protocolSchema = getProtocolSchema_1.getProtocolSchema(), publisherOptionsSchema = getPublisherOptionsSchema_1.getPublisherOptionsSchema(), snapshotStrategySchema = getSnapshotStrategySchema_1.getSnapshotStrategySchema(), subscriberOptionsSchema = getSubscriberOptionsSchema_1.getSubscriberOptionsSchema();
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
    commandDispatcherHostName: {
        environmentVariable: 'COMMAND_DISPATCHER_HOST_NAME',
        defaultValue: 'command-dispatcher',
        schema: { type: 'string', format: 'hostname' }
    },
    commandDispatcherPortOrSocket: {
        environmentVariable: 'COMMAND_DISPATCHER_PORT_OR_SOCKET',
        defaultValue: 3000,
        schema: portOrSocketSchema
    },
    commandDispatcherProtocol: {
        environmentVariable: 'COMMAND_DISPATCHER_PROTOCOL',
        defaultValue: 'http',
        schema: protocolSchema
    },
    commandDispatcherRetries: {
        environmentVariable: 'COMMAND_DISPATCHER_RETRIES',
        defaultValue: 5,
        schema: { type: 'integer' }
    },
    corsOrigin: {
        environmentVariable: 'CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
    },
    enableIntegratedClient: {
        environmentVariable: 'ENABLE_INTEGRATED_CLIENT',
        defaultValue: false,
        schema: { type: 'boolean' }
    },
    healthPortOrSocket: {
        environmentVariable: 'HEALTH_PORT_OR_SOCKET',
        defaultValue: 3001,
        schema: portOrSocketSchema
    },
    identityProviders: {
        environmentVariable: 'IDENTITY_PROVIDERS',
        defaultValue: [],
        schema: identityProviderSchema
    },
    portOrSocket: {
        environmentVariable: 'PORT_OR_SOCKET',
        defaultValue: 3000,
        schema: portOrSocketSchema
    },
    pubSubOptions: {
        environmentVariable: 'PUB_SUB_OPTIONS',
        defaultValue: {
            channelForNewDomainEvents: 'newDomainEvent',
            channelForNotifications: 'notification',
            publisher: {
                type: 'Http',
                protocol: 'http',
                hostName: 'publisher',
                portOrSocket: 3000,
                path: '/publish/v2'
            },
            subscriber: {
                type: 'Http',
                protocol: 'http',
                hostName: 'publisher',
                portOrSocket: 3000,
                path: '/subscribe/v2'
            }
        },
        schema: {
            type: 'object',
            properties: {
                channelForNewDomainEvents: { type: 'string', minLength: 1 },
                channelForNotifications: { type: 'string', minLength: 1 },
                publisher: publisherOptionsSchema,
                subscriber: subscriberOptionsSchema
            },
            required: ['channelForNewDomainEvents', 'channelForNotifications', 'publisher', 'subscriber'],
            additionalProperties: false
        }
    },
    snapshotStrategy: {
        environmentVariable: 'SNAPSHOT_STRATEGY',
        defaultValue: { name: 'revision', configuration: { revisionLimit: 100 } },
        schema: snapshotStrategySchema
    }
};
exports.configurationDefinition = configurationDefinition;
//# sourceMappingURL=configurationDefinition.js.map