"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurationDefinition = void 0;
const getCorsSchema_1 = require("../../../shared/schemas/getCorsSchema");
const getDomainEventStoreOptionsSchema_1 = require("../../../shared/schemas/getDomainEventStoreOptionsSchema");
const getPortOrSocketSchema_1 = require("../../../shared/schemas/getPortOrSocketSchema");
const corsSchema = getCorsSchema_1.getCorsSchema(), domainEventStoreOptionsSchema = getDomainEventStoreOptionsSchema_1.getDomainEventStoreOptionsSchema(), portOrSocketSchema = getPortOrSocketSchema_1.getPortOrSocketSchema();
const configurationDefinition = {
    domainEventStoreOptions: {
        environmentVariable: 'DOMAIN_EVENT_STORE_OPTIONS',
        defaultValue: { type: 'InMemory' },
        schema: domainEventStoreOptionsSchema
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
    },
    queryDomainEventsCorsOrigin: {
        environmentVariable: 'QUERY_DOMAIN_EVENTS_CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
    },
    writeDomainEventsCorsOrigin: {
        environmentVariable: 'WRITE_DOMAIN_EVENTS_CORS_ORIGIN',
        defaultValue: '*',
        schema: corsSchema
    }
};
exports.configurationDefinition = configurationDefinition;
//# sourceMappingURL=configurationDefinition.js.map