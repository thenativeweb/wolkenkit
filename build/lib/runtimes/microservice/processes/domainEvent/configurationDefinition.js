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
const getProtocolSchema_1 = require("../../../shared/schemas/getProtocolSchema");
const getPublisherOptionsSchema_1 = require("../../../shared/schemas/getPublisherOptionsSchema");
const getSnapshotStrategySchema_1 = require("../../../shared/schemas/getSnapshotStrategySchema");
const getSubscriberOptionsSchema_1 = require("../../../shared/schemas/getSubscriberOptionsSchema");
const path_1 = __importDefault(require("path"));
const corsSchema = getCorsSchema_1.getCorsSchema(), heartbeatIntervalSchema = getHeartbeatIntervalSchema_1.getHeartbeatIntervalSchema(), identityProviderSchema = getIdentityProviderSchema_1.getIdentityProviderSchema(), portOrSocketSchema = getPortOrSocketSchema_1.getPortOrSocketSchema(), protocolSchema = getProtocolSchema_1.getProtocolSchema(), publisherOptionsSchema = getPublisherOptionsSchema_1.getPublisherOptionsSchema(), snapshotStrategySchema = getSnapshotStrategySchema_1.getSnapshotStrategySchema(), subscriberOptionsSchema = getSubscriberOptionsSchema_1.getSubscriberOptionsSchema();
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
    domainEventCorsOrigin: {
        environmentVariable: 'DOMAIN_EVENT_CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
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
        defaultValue: 3000,
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
            subscriber: {
                type: 'Http',
                protocol: 'http',
                hostName: 'publisher',
                portOrSocket: 3000,
                path: '/publish/v2'
            },
            publisher: {
                type: 'Http',
                protocol: 'http',
                hostName: 'publisher',
                portOrSocket: 3000,
                path: '/publish/v2'
            }
        },
        schema: {
            type: 'object',
            properties: {
                channelForNewDomainEvents: { type: 'string', minLength: 1 },
                channelForNotifications: { type: 'string', minLength: 1 },
                subscriber: subscriberOptionsSchema,
                publisher: publisherOptionsSchema
            },
            required: ['channelForNewDomainEvents', 'channelForNotifications', 'subscriber', 'publisher'],
            additionalProperties: false
        }
    },
    snapshotStrategy: {
        environmentVariable: 'SNAPSHOT_STRATEGY',
        defaultValue: {
            name: 'lowest',
            configuration: {
                revisionLimit: 100,
                durationLimit: 500
            }
        },
        schema: snapshotStrategySchema
    }
};
exports.configurationDefinition = configurationDefinition;
//# sourceMappingURL=configurationDefinition.js.map