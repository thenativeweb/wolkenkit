"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiDefinitions = void 0;
const getDescription_1 = require("./v2/getDescription");
const postCommand_1 = require("./v2/postCommand");
const postCommandWithoutAggregateId_1 = require("./v2/postCommandWithoutAggregateId");
const getApiDefinitions = function ({ application, basePath }) {
    const apiDefinitions = [];
    const v2ApiDefinition = {
        basePath: `${basePath}/v2`,
        routes: {
            get: [
                getDescription_1.getDescription
            ],
            post: []
        },
        tags: ['Commands']
    };
    for (const [contextName, contextDefinition] of Object.entries(application.domain)) {
        for (const [aggregateName, aggregateDefinition] of Object.entries(contextDefinition)) {
            for (const [commandName, commandHandler] of Object.entries(aggregateDefinition.commandHandlers)) {
                v2ApiDefinition.routes.post.push({
                    path: `${contextName}/${aggregateName}/:aggregateId/${commandName}`,
                    description: commandHandler.getDocumentation ? commandHandler.getDocumentation() : postCommand_1.postCommand.description,
                    request: {
                        body: commandHandler.getSchema ? commandHandler.getSchema() : { type: 'object' }
                    },
                    response: postCommand_1.postCommand.response
                });
                v2ApiDefinition.routes.post.push({
                    path: `${contextName}/${aggregateName}/${commandName}`,
                    description: commandHandler.getDocumentation ? commandHandler.getDocumentation() : postCommandWithoutAggregateId_1.postCommandWithoutAggregateId.description,
                    request: {
                        body: commandHandler.getSchema ? commandHandler.getSchema() : { type: 'object' }
                    },
                    response: postCommandWithoutAggregateId_1.postCommandWithoutAggregateId.response
                });
            }
        }
    }
    apiDefinitions.push(v2ApiDefinition);
    return apiDefinitions;
};
exports.getApiDefinitions = getApiDefinitions;
//# sourceMappingURL=getApiDefinitions.js.map