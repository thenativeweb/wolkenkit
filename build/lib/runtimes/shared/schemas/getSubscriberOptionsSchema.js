"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubscriberOptionsSchema = void 0;
const getPortOrSocketSchema_1 = require("./getPortOrSocketSchema");
const getProtocolSchema_1 = require("./getProtocolSchema");
const portOrSocketSchema = getPortOrSocketSchema_1.getPortOrSocketSchema(), protocolSchema = getProtocolSchema_1.getProtocolSchema();
const getSubscriberOptionsSchema = function () {
    return {
        type: 'object',
        oneOf: [
            {
                properties: {
                    type: { type: 'string', enum: ['InMemory'] }
                },
                required: ['type'],
                additionalProperties: false
            },
            {
                properties: {
                    type: { type: 'string', enum: ['Http'] },
                    protocol: protocolSchema,
                    hostName: { type: 'string', format: 'hostname' },
                    portOrSocket: portOrSocketSchema,
                    path: { type: 'string' }
                },
                required: ['type', 'hostName', 'portOrSocket'],
                additionalProperties: false
            }
        ]
    };
};
exports.getSubscriberOptionsSchema = getSubscriberOptionsSchema;
//# sourceMappingURL=getSubscriberOptionsSchema.js.map