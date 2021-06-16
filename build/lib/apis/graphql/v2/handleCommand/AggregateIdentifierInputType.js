"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateIdentifierInputType = void 0;
const graphql_1 = require("graphql");
const AggregateIdentifierInputType = new graphql_1.GraphQLInputObjectType({
    name: 'AggregateIdentifier',
    fields: {
        id: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)
        }
    }
});
exports.AggregateIdentifierInputType = AggregateIdentifierInputType;
//# sourceMappingURL=AggregateIdentifierInputType.js.map