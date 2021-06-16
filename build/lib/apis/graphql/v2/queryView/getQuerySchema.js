"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuerySchema = void 0;
const getViewFieldConfiguration_1 = require("./getViewFieldConfiguration");
const graphql_1 = require("graphql");
const getQuerySchema = function ({ application }) {
    const queryFieldConfigurations = {};
    for (const [viewName, view] of Object.entries(application.views)) {
        queryFieldConfigurations[viewName] = getViewFieldConfiguration_1.getViewFieldConfiguration({
            application,
            view,
            viewName
        });
    }
    return new graphql_1.GraphQLObjectType({
        name: 'Query',
        fields: queryFieldConfigurations
    });
};
exports.getQuerySchema = getQuerySchema;
//# sourceMappingURL=getQuerySchema.js.map