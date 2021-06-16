import { GraphQLType } from 'graphql';
declare const instantiateGraphqlTypeDefinitions: ({ typeName, typeDefinitions }: {
    typeName: string;
    typeDefinitions: string[];
}) => GraphQLType;
export { instantiateGraphqlTypeDefinitions };
