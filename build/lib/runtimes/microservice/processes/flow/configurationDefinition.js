"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationDefinition = void 0;
const getConsumerProgressStoreOptionsSchema_1 = require("../../../shared/schemas/getConsumerProgressStoreOptionsSchema");
const getCorsSchema_1 = require("../../../shared/schemas/getCorsSchema");
const getLockStoreOptionsSchema_1 = require("../../../shared/schemas/getLockStoreOptionsSchema");
const getPortOrSocketSchema_1 = require("../../../shared/schemas/getPortOrSocketSchema");
const getProtocolSchema_1 = require("../../../shared/schemas/getProtocolSchema");
const getPublisherOptionsSchema_1 = require("../../../shared/schemas/getPublisherOptionsSchema");
const getSnapshotStrategySchema_1 = require("../../../shared/schemas/getSnapshotStrategySchema");
const path_1 = __importDefault(require("path"));
const consumerProgressStoreOptionsSchema = getConsumerProgressStoreOptionsSchema_1.getConsumerProgressStoreOptionsSchema(), corsSchema = getCorsSchema_1.getCorsSchema(), lockStoreOptionsSchema = getLockStoreOptionsSchema_1.getLockStoreOptionsSchema(), portOrSocketSchema = getPortOrSocketSchema_1.getPortOrSocketSchema(), protocolSchema = getProtocolSchema_1.getProtocolSchema(), publisherOptionsSchema = getPublisherOptionsSchema_1.getPublisherOptionsSchema(), snapshotStrategySchema = getSnapshotStrategySchema_1.getSnapshotStrategySchema();
const configurationDefinition = {
    aeonstoreHostName: {
        environmentVariable: 'AEONSTORE_HOST_NAME',
        defaultValue: 'aeonstore',
        schema: {
            type: 'string',
            format: 'hostname'
        }
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
        schema: {
            type: 'string',
            minLength: 1
        }
    },
    commandDispatcherHostName: {
        environmentVariable: 'COMMAND_DISPATCHER_HOST_NAME',
        defaultValue: 'command-dispatcher',
        schema: {
            type: 'string',
            format: 'hostname'
        }
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
    concurrentFlows: {
        environmentVariable: 'CONCURRENT_FLOWS',
        defaultValue: 1,
        schema: {
            type: 'number',
            minimum: 1
        }
    },
    consumerProgressStoreOptions: {
        environmentVariable: 'CONSUMER_PROGRESS_STORE_OPTIONS',
        defaultValue: { type: 'InMemory' },
        schema: consumerProgressStoreOptionsSchema
    },
    domainEventDispatcherAcknowledgeRetries: {
        environmentVariable: 'DOMAIN_EVENT_DISPATCHER_ACKNOWLEDGE_RETRIES',
        defaultValue: 5,
        schema: { type: 'integer' }
    },
    domainEventDispatcherHostName: {
        environmentVariable: 'DOMAIN_EVENT_DISPATCHER_HOST_NAME',
        defaultValue: 'domain-event-dispatcher',
        schema: {
            type: 'string',
            format: 'hostname'
        }
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
    domainEventDispatcherRenewInterval: {
        environmentVariable: 'DOMAIN_EVENT_DISPATCHER_RENEW_INTERVAL',
        defaultValue: 5000,
        schema: { type: 'integer' }
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
    lockStoreOptions: {
        environmentVariable: 'LOCK_STORE_OPTIONS',
        defaultValue: { type: 'InMemory' },
        schema: lockStoreOptionsSchema
    },
    pubSubOptions: {
        environmentVariable: 'PUB_SUB_OPTIONS',
        defaultValue: {
            channelForNotifications: 'notifications',
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
                channelForNotifications: { type: 'string', minLength: 1 },
                publisher: publisherOptionsSchema
            },
            required: ['channelForNotifications', 'publisher'],
            additionalProperties: false
        }
    },
    replayServerHostName: {
        environmentVariable: 'REPLAY_SERVER_HOST_NAME',
        defaultValue: 'replay',
        schema: {
            type: 'string',
            format: 'hostname'
        }
    },
    replayServerPortOrSocket: {
        environmentVariable: 'REPLAY_SERVER_PORT_OR_SOCKET',
        defaultValue: 3000,
        schema: portOrSocketSchema
    },
    replayServerProtocol: {
        environmentVariable: 'REPLAY_SERVER_PROTOCOL',
        defaultValue: 'http',
        schema: protocolSchema
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