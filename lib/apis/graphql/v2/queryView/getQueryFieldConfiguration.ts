import { addMissingPrototype } from '../../../../common/utils/graphql/addMissingPrototype';
import { Application } from '../../../../common/application/Application';
import { errors } from '../../../../common/errors';
import { executeQueryHandler } from '../../../../common/domain/executeQueryHandler';
import { getClientService } from '../../../../common/services/getClientService';
import { getGraphqlFromJsonSchema } from 'get-graphql-from-jsonschema';
import { QueryHandler } from '../../../../common/elements/QueryHandler';
import { ResolverContext } from '../ResolverContext';
import {
  buildSchema,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLInputObjectType,
  GraphQLList
} from 'graphql';

const getQueryFieldConfiguration = function ({ application, viewName, queryName, queryHandler }: {
  application: Application;
  viewName: string;
  queryName: string;
  queryHandler: QueryHandler<any, any>;
}): GraphQLFieldConfig<{ viewName: string }, ResolverContext> {
  // eslint-disable-next-line @typescript-eslint/unbound-method
  if (!queryHandler.getResultItemSchema) {
    throw new errors.GraphQlError(`Result item schema in query '${viewName}.${queryName}' is missing, but required for GraphQL.`);
  }

  const resultItemSchema = queryHandler.getResultItemSchema();
  const resultItemGraphqlTypeDefinitions = getGraphqlFromJsonSchema({
    rootName: `${viewName}_${queryName}_resultItem`,
    schema: resultItemSchema,
    direction: 'output'
  });
  const resultGraphqlType = new GraphQLList(
    buildSchema(
      resultItemGraphqlTypeDefinitions.typeDefinitions.join('\n')
    ).getType(resultItemGraphqlTypeDefinitions.typeName) as GraphQLInputObjectType
  );

  const argumentConfigurationMap: GraphQLFieldConfigArgumentMap = {};

  // eslint-disable-next-line @typescript-eslint/unbound-method
  if (queryHandler.getOptionsSchema) {
    const optionsSchema = queryHandler.getOptionsSchema();
    const optionsGraphqlTypeDefinitions = getGraphqlFromJsonSchema({
      rootName: `${viewName}_${queryName}_options`,
      schema: optionsSchema,
      direction: 'input'
    });
    const optionsGraphqlType = buildSchema(
      optionsGraphqlTypeDefinitions.typeDefinitions.join('\n')
    ).getType(optionsGraphqlTypeDefinitions.typeName) as GraphQLInputObjectType;

    argumentConfigurationMap.options = { type: optionsGraphqlType };
  }

  return {
    type: resultGraphqlType,
    args: argumentConfigurationMap,
    description: queryHandler.getDocumentation?.() ?? 'No documentation available.',
    async resolve (_source, { options: rawOptions }, { clientMetadata }): Promise<any> {
      const options = addMissingPrototype({ value: rawOptions });

      const resultStream = await executeQueryHandler({
        application,
        queryHandlerIdentifier: { view: { name: viewName }, name: queryName },
        options,
        services: {
          client: getClientService({ clientMetadata })
        }
      });

      const resultItems = [];

      for await (const resultItem of resultStream) {
        resultItems.push(resultItem);
      }

      return resultItems;
    }
  };
};

export { getQueryFieldConfiguration };
