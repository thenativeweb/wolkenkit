"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregateIdentifierType = void 0;
const graphql_1 = require("graphql");
const AggregateIdentifierType = new graphql_1.GraphQLObjectType({
    name: 'AggregateIdentifierOutput',
    fields: {
        id: {
            type: new graphql_1.GraphQLNonNull(graphql_1.GraphQLString)
        }
    }
});
exports.AggregateIdentifierType = AggregateIdentifierType;
//# sourceMappingURL=AggregateIdentifierType.js.map