"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationDefinition = void 0;
const getCorsSchema_1 = require("../../../shared/schemas/getCorsSchema");
const getPortOrSocketSchema_1 = require("../../../shared/schemas/getPortOrSocketSchema");
const getPriorityQueueStoreOptionsSchema_1 = require("../../../shared/schemas/getPriorityQueueStoreOptionsSchema");
const getPublisherOptionsSchema_1 = require("../../../shared/schemas/getPublisherOptionsSchema");
const getSubscriberOptionsSchema_1 = require("../../../shared/schemas/getSubscriberOptionsSchema");
const path_1 = __importDefault(require("path"));
const corsSchema = getCorsSchema_1.getCorsSchema(), portOrSocketSchema = getPortOrSocketSchema_1.getPortOrSocketSchema(), priorityQueueStoreOptionsSchema = getPriorityQueueStoreOptionsSchema_1.getPriorityQueueStoreOptionsSchema();
const configurationDefinition = {
    applicationDirectory: {
        environmentVariable: 'APPLICATION_DIRECTORY',
        defaultValue: path_1.default.join(__dirname, '..', '..', '..', '..', '..', 'test', 'shared', 'applications', 'javascript', 'base'),
        schema: { type: 'string', minLength: 1 }
    },
    awaitCommandCorsOrigin: {
        environmentVariable: 'AWAIT_COMMAND_CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
    },
    handleCommandCorsOrigin: {
        environmentVariable: 'HANDLE_COMMAND_CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
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
    missedCommandRecoveryInterval: {
        environmentVariable: 'MISSED_COMMAND_RECOVERY_INTERVAL',
        defaultValue: 5000,
        schema: { type: 'number', minimum: 1 }
    },
    portOrSocket: {
        environmentVariable: 'PORT_OR_SOCKET',
        defaultValue: 3000,
        schema: portOrSocketSchema
    },
    priorityQueueStoreOptions: {
        environmentVariable: 'PRIORITY_QUEUE_STORE_OPTIONS',
        defaultValue: { type: 'InMemory', expirationTime: 30000 },
        schema: priorityQueueStoreOptionsSchema
    },
    pubSubOptions: {
        environmentVariable: 'PUB_SUB_OPTIONS',
        defaultValue: {
            channelForNewCommands: 'new-command',
            subscriber: { type: 'InMemory' },
            publisher: { type: 'InMemory' }
        },
        schema: {
            type: 'object',
            properties: {
                channelForNewCommands: { type: 'string', minLength: 1 },
                subscriber: getSubscriberOptionsSchema_1.getSubscriberOptionsSchema(),
                publisher: getPublisherOptionsSchema_1.getPublisherOptionsSchema()
            },
            required: ['channelForNewCommands', 'subscriber', 'publisher'],
            additionalProperties: false
        }
    }
};
exports.configurationDefinition = configurationDefinition;
//# sourceMappingURL=configurationDefinition.js.map