"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getViewsDescription = void 0;
const common_tags_1 = require("common-tags");
const getViewsDescription = function ({ viewsDefinition }) {
    const viewsDescription = {};
    for (const [viewName, viewDefinition] of Object.entries(viewsDefinition)) {
        viewsDescription[viewName] = {};
        for (const [queryName, queryHandler] of Object.entries(viewDefinition.queryHandlers)) {
            const queryDescription = {};
            if (queryHandler.getDocumentation) {
                queryDescription.documentation = common_tags_1.stripIndent(queryHandler.getDocumentation().trim());
            }
            if (queryHandler.getOptionsSchema) {
                queryDescription.optionsSchema = queryHandler.getOptionsSchema();
            }
            if (queryHandler.getResultItemSchema) {
                queryDescription.itemSchema = queryHandler.getResultItemSchema();
            }
            viewsDescription[viewName][queryName] = queryDescription;
        }
    }
    return viewsDescription;
};
exports.getViewsDescription = getViewsDescription;
//# sourceMappingURL=getViewsDescription.js.map