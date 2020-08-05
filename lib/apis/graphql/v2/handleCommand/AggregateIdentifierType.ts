import { GraphQLNonNull, GraphQLObjectType, GraphQLString } from 'graphql';

const AggregateIdentifierType = new GraphQLObjectType({
  name: `AggregateIdentifierOutput`,
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString)
    }
  }
});

export { AggregateIdentifierType };
