"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationDefinition = void 0;
const getCorsSchema_1 = require("../../../shared/schemas/getCorsSchema");
const getPortOrSocketSchema_1 = require("../../../shared/schemas/getPortOrSocketSchema");
const getPublisherOptionsSchema_1 = require("../../../shared/schemas/getPublisherOptionsSchema");
const getSubscriberOptionsSchema_1 = require("../../../shared/schemas/getSubscriberOptionsSchema");
const corsSchema = getCorsSchema_1.getCorsSchema(), portOrSocketSchema = getPortOrSocketSchema_1.getPortOrSocketSchema();
const configurationDefinition = {
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
    },
    publishCorsOrigin: {
        environmentVariable: 'PUBLISH_CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
    },
    pubSubOptions: {
        environmentVariable: 'PUB_SUB_OPTIONS',
        defaultValue: {
            subscriber: { type: 'InMemory' },
            publisher: { type: 'InMemory' }
        },
        schema: {
            type: 'object',
            properties: {
                subscriber: getSubscriberOptionsSchema_1.getSubscriberOptionsSchema(),
                publisher: getPublisherOptionsSchema_1.getPublisherOptionsSchema()
            },
            required: ['subscriber', 'publisher'],
            additionalProperties: false
        }
    },
    subscribeCorsOrigin: {
        environmentVariable: 'SUBSCRIBE_CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
    }
};
exports.configurationDefinition = configurationDefinition;
//# sourceMappingURL=configurationDefinition.js.map