import { GraphQLInputObjectType, GraphQLNonNull, GraphQLString } from 'graphql';

const AggregateIdentifierInputType = new GraphQLInputObjectType({
  name: 'AggregateIdentifier',
  fields: {
    id: {
      type: new GraphQLNonNull(GraphQLString)
    }
  }
});

export { AggregateIdentifierInputType };
