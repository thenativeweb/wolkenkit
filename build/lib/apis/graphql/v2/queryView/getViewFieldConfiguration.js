"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getViewFieldConfiguration = void 0;
const getQueryFieldConfiguration_1 = require("./getQueryFieldConfiguration");
const graphql_1 = require("graphql");
const getViewFieldConfiguration = function ({ application, view, viewName }) {
    const viewFieldConfigurations = {};
    for (const [queryName, queryHandler] of Object.entries(view.queryHandlers)) {
        viewFieldConfigurations[queryName] = getQueryFieldConfiguration_1.getQueryFieldConfiguration({
            application,
            viewName,
            queryName,
            queryHandler
        });
    }
    return {
        type: new graphql_1.GraphQLObjectType({
            name: viewName,
            fields: viewFieldConfigurations
        }),
        resolve() {
            return { viewName };
        }
    };
};
exports.getViewFieldConfiguration = getViewFieldConfiguration;
//# sourceMappingURL=getViewFieldConfiguration.js.map