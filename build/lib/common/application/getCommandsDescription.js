"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCommandsDescription = void 0;
const common_tags_1 = require("common-tags");
const getCommandsDescription = function ({ domainDefinition }) {
    const commandsDescription = {};
    for (const [contextName, contextDefinition] of Object.entries(domainDefinition)) {
        commandsDescription[contextName] = {};
        for (const [aggregateName, aggregateDefinition] of Object.entries(contextDefinition)) {
            commandsDescription[contextName][aggregateName] = {};
            for (const [commandName, commandHandler] of Object.entries(aggregateDefinition.commandHandlers)) {
                const description = {};
                if (commandHandler.getDocumentation) {
                    description.documentation = common_tags_1.stripIndent(commandHandler.getDocumentation().trim());
                }
                if (commandHandler.getSchema) {
                    description.schema = commandHandler.getSchema();
                }
                commandsDescription[contextName][aggregateName][commandName] = description;
            }
        }
    }
    return commandsDescription;
};
exports.getCommandsDescription = getCommandsDescription;
//# sourceMappingURL=getCommandsDescription.js.map