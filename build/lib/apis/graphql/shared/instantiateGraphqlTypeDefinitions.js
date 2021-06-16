"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.instantiateGraphqlTypeDefinitions = void 0;
const graphql_1 = require("graphql");
const instantiateGraphqlTypeDefinitions = function ({ typeName, typeDefinitions }) {
    const resultGraphqlSchema = graphql_1.buildSchema(typeDefinitions.join('\n'));
    if (typeName.startsWith('[')) {
        return new graphql_1.GraphQLList(resultGraphqlSchema.getType(typeName.slice(1, -1)));
    }
    return resultGraphqlSchema.getType(typeName);
};
exports.instantiateGraphqlTypeDefinitions = instantiateGraphqlTypeDefinitions;
//# sourceMappingURL=instantiateGraphqlTypeDefinitions.js.map