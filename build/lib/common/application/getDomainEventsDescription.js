"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDomainEventsDescription = void 0;
const common_tags_1 = require("common-tags");
const getDomainEventsDescription = function ({ domainDefinition }) {
    const domainEventsDescription = {};
    for (const [contextName, contextDefinition] of Object.entries(domainDefinition)) {
        domainEventsDescription[contextName] = {};
        for (const [aggregateName, aggregateDefinition] of Object.entries(contextDefinition)) {
            domainEventsDescription[contextName][aggregateName] = {};
            for (const [domainEventName, domainEventHandler] of Object.entries(aggregateDefinition.domainEventHandlers)) {
                const description = {};
                if (domainEventHandler.getDocumentation) {
                    description.documentation = common_tags_1.stripIndent(domainEventHandler.getDocumentation().trim());
                }
                if (domainEventHandler.getSchema) {
                    description.schema = domainEventHandler.getSchema();
                }
                domainEventsDescription[contextName][aggregateName][domainEventName] = description;
            }
        }
    }
    return domainEventsDescription;
};
exports.getDomainEventsDescription = getDomainEventsDescription;
//# sourceMappingURL=getDomainEventsDescription.js.map