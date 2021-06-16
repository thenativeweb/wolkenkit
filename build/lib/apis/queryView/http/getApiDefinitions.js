"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getApiDefinitions = void 0;
const queryStream_1 = require("./v2/queryStream");
const getApiDefinitions = function ({ application, basePath }) {
    const apiDefinitions = [];
    const v2ApiDefinition = {
        basePath: `${basePath}/v2`,
        routes: {
            get: [],
            post: []
        },
        tags: ['Views']
    };
    for (const [viewName, viewDefinition] of Object.entries(application.views)) {
        for (const [queryHandlerName, queryDefinition] of Object.entries(viewDefinition.queryHandlers)) {
            v2ApiDefinition.routes.get.push({
                path: `${viewName}/${queryDefinition.type}/${queryHandlerName}`,
                description: queryDefinition.getDocumentation ? queryDefinition.getDocumentation() : queryStream_1.queryStream.description,
                request: {
                    query: queryDefinition.getOptionsSchema ? queryDefinition.getOptionsSchema() : queryStream_1.queryStream.request.query
                },
                response: {
                    statusCodes: queryStream_1.queryStream.response.statusCodes,
                    stream: queryDefinition.type === 'stream',
                    body: queryDefinition.getResultItemSchema ? queryDefinition.getResultItemSchema() : {}
                }
            });
        }
    }
    apiDefinitions.push(v2ApiDefinition);
    return apiDefinitions;
};
exports.getApiDefinitions = getApiDefinitions;
//# sourceMappingURL=getApiDefinitions.js.map