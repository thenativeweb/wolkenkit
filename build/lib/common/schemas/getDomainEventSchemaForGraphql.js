"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDomainEventSchemaForGraphql = void 0;
const getDomainEventSchema_1 = require("./getDomainEventSchema");
const getDomainEventSchemaForGraphql = function () {
    const domainEventSchema = getDomainEventSchema_1.getDomainEventSchema();
    domainEventSchema.properties.data = {
        type: 'string',
        description: `The event's payload as a JSON string.`
    };
    delete domainEventSchema.properties.metadata.properties.initiator.properties.user.properties.claims;
    domainEventSchema.properties.metadata.properties.initiator.properties.user.required = ['id'];
    return domainEventSchema;
};
exports.getDomainEventSchemaForGraphql = getDomainEventSchemaForGraphql;
//# sourceMappingURL=getDomainEventSchemaForGraphql.js.map