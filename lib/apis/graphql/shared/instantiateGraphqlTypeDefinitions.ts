import { buildSchema, GraphQLList, GraphQLType } from 'graphql';

const instantiateGraphqlTypeDefinitions = function ({
  typeName,
  typeDefinitions
}: {
  typeName: string;
  typeDefinitions: string[];
}): GraphQLType {
  const resultGraphqlSchema = buildSchema(
    typeDefinitions.join('\n')
  );

  if (typeName.startsWith('[')) {
    return new GraphQLList(resultGraphqlSchema.getType(typeName.slice(1, -1)) as GraphQLType);
  }

  return resultGraphqlSchema.getType(typeName) as GraphQLType;
};

export {
  instantiateGraphqlTypeDefinitions
};
