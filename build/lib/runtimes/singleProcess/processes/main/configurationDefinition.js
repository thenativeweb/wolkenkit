"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationDefinition = void 0;
const getConsumerProgressStoreOptionsSchema_1 = require("../../../shared/schemas/getConsumerProgressStoreOptionsSchema");
const getCorsSchema_1 = require("../../../shared/schemas/getCorsSchema");
const getDomainEventStoreOptionsSchema_1 = require("../../../shared/schemas/getDomainEventStoreOptionsSchema");
const getFileStoreOptionsSchema_1 = require("../../../shared/schemas/getFileStoreOptionsSchema");
const getHeartbeatIntervalSchema_1 = require("../../../shared/schemas/getHeartbeatIntervalSchema");
const getIdentityProviderSchema_1 = require("../../../shared/schemas/getIdentityProviderSchema");
const getLockStoreOptionsSchema_1 = require("../../../shared/schemas/getLockStoreOptionsSchema");
const getPortOrSocketSchema_1 = require("../../../shared/schemas/getPortOrSocketSchema");
const getPriorityQueueStoreOptionsSchema_1 = require("../../../shared/schemas/getPriorityQueueStoreOptionsSchema");
const getPublisherOptionsSchema_1 = require("../../../shared/schemas/getPublisherOptionsSchema");
const getSnapshotStrategySchema_1 = require("../../../shared/schemas/getSnapshotStrategySchema");
const getSubscriberOptionsSchema_1 = require("../../../shared/schemas/getSubscriberOptionsSchema");
const path_1 = __importDefault(require("path"));
const consumerProgressStoreOptionsSchema = getConsumerProgressStoreOptionsSchema_1.getConsumerProgressStoreOptionsSchema(), corsSchema = getCorsSchema_1.getCorsSchema(), domainEventStoreOptionsSchema = getDomainEventStoreOptionsSchema_1.getDomainEventStoreOptionsSchema(), fileStoreOptionsSchema = getFileStoreOptionsSchema_1.getFileStoreOptionsSchema(), heartbeatIntervalSchema = getHeartbeatIntervalSchema_1.getHeartbeatIntervalSchema(), identityProviderSchema = getIdentityProviderSchema_1.getIdentityProviderSchema(), lockStoreOptionsSchema = getLockStoreOptionsSchema_1.getLockStoreOptionsSchema(), portOrSocketSchema = getPortOrSocketSchema_1.getPortOrSocketSchema(), priorityQueueStoreOptionsSchema = getPriorityQueueStoreOptionsSchema_1.getPriorityQueueStoreOptionsSchema(), publisherOptionsSchema = getPublisherOptionsSchema_1.getPublisherOptionsSchema(), snapshotStrategySchema = getSnapshotStrategySchema_1.getSnapshotStrategySchema(), subscriberOptionsSchema = getSubscriberOptionsSchema_1.getSubscriberOptionsSchema();
const configurationDefinition = {
    applicationDirectory: {
        environmentVariable: 'APPLICATION_DIRECTORY',
        defaultValue: path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
        schema: {
            type: 'string',
            minLength: 1
        }
    },
    commandQueueRenewInterval: {
        environmentVariable: 'COMMAND_QUEUE_RENEW_INTERVAL',
        defaultValue: 5000,
        schema: { type: 'integer' }
    },
    concurrentCommands: {
        environmentVariable: 'CONCURRENT_COMMANDS',
        defaultValue: 1,
        schema: {
            type: 'number',
            minimum: 1
        }
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
    corsOrigin: {
        environmentVariable: 'CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
    },
    domainEventStoreOptions: {
        environmentVariable: 'DOMAIN_EVENT_STORE_OPTIONS',
        defaultValue: { type: 'InMemory' },
        schema: domainEventStoreOptionsSchema
    },
    enableOpenApiDocumentation: {
        environmentVariable: 'ENABLE_OPEN_API_DOCUMENTATION',
        defaultValue: false,
        schema: { type: 'boolean' }
    },
    fileStoreOptions: {
        environmentVariable: 'FILE_STORE_OPTIONS',
        defaultValue: { type: 'InMemory' },
        schema: fileStoreOptionsSchema
    },
    graphqlApi: {
        environmentVariable: 'GRAPHQL_API',
        defaultValue: false,
        schema: {
            oneOf: [
                { type: 'boolean', enum: [false] },
                {
                    type: 'object',
                    properties: {
                        enableIntegratedClient: { type: 'boolean' }
                    }
                }
            ]
        }
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
    httpApi: {
        environmentVariable: 'HTTP_API',
        defaultValue: true,
        schema: { type: 'boolean' }
    },
    identityProviders: {
        environmentVariable: 'IDENTITY_PROVIDERS',
        defaultValue: [],
        schema: identityProviderSchema
    },
    lockStoreOptions: {
        environmentVariable: 'LOCK_STORE_OPTIONS',
        defaultValue: { type: 'InMemory' },
        schema: lockStoreOptionsSchema
    },
    portOrSocket: {
        environmentVariable: 'PORT_OR_SOCKET',
        defaultValue: 3000,
        schema: portOrSocketSchema
    },
    priorityQueueStoreForCommandsOptions: {
        environmentVariable: 'PRIORITY_QUEUE_STORE_FOR_COMMANDS_OPTIONS',
        defaultValue: { type: 'InMemory', expirationTime: 30000 },
        schema: priorityQueueStoreOptionsSchema
    },
    priorityQueueStoreForDomainEventsOptions: {
        environmentVariable: 'PRIORITY_QUEUE_STORE_FOR_DOMAIN_EVENTS_OPTIONS',
        defaultValue: { type: 'InMemory', expirationTime: 30000 },
        schema: priorityQueueStoreOptionsSchema
    },
    pubSubOptions: {
        environmentVariable: 'PUB_SUB_OPTIONS',
        defaultValue: {
            channelForNotifications: 'notification',
            subscriber: { type: 'InMemory' },
            publisher: { type: 'InMemory' }
        },
        schema: {
            type: 'object',
            properties: {
                channelForNotifications: { type: 'string', minLength: 1 },
                subscriber: subscriberOptionsSchema,
                publisher: publisherOptionsSchema
            },
            required: ['channelForNotifications', 'subscriber', 'publisher'],
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