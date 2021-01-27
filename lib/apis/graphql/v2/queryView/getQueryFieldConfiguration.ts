import { addMissingPrototype } from '../../../../common/utils/graphql/addMissingPrototype';
import { Application } from '../../../../common/application/Application';
import { errors } from '../../../../common/errors';
import { executeStreamQueryHandler } from '../../../../common/domain/executeStreamQueryHandler';
import { executeValueQueryHandler } from '../../../../common/domain/executeValueQueryHandler';
import { getClientService } from '../../../../common/services/getClientService';
import { getGraphqlFromJsonSchema } from 'get-graphql-from-jsonschema';
import { QueryHandlerReturnsStream } from '../../../../common/elements/QueryHandlerReturnsStream';
import { QueryHandlerReturnsValue } from '../../../../common/elements/QueryHandlerReturnsValue';
import { ResolverContext } from '../ResolverContext';
import {
  buildSchema,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLOutputType
} from 'graphql';

const getQueryFieldConfiguration = function ({ application, viewName, queryName, queryHandler }: {
  application: Application;
  viewName: string;
  queryName: string;
  queryHandler: QueryHandlerReturnsValue<any, any> | QueryHandlerReturnsStream<any, any>;
}): GraphQLFieldConfig<{ viewName: string }, ResolverContext> {
  if (!queryHandler.getResultItemSchema) {
    throw new errors.GraphQlError(`Result item schema in query '${viewName}.${queryName}' is missing, but required for GraphQL.`);
  }

  const resultItemSchema = queryHandler.getResultItemSchema();
  const resultItemGraphqlTypeDefinitions = getGraphqlFromJsonSchema({
    rootName: `${viewName}_${queryName}_resultItem`,
    schema: resultItemSchema,
    direction: 'output'
  });
  const resultGraphqlType = buildSchema(
    resultItemGraphqlTypeDefinitions.typeDefinitions.join('\n')
  ).getType(resultItemGraphqlTypeDefinitions.typeName) as GraphQLOutputType;

  const argumentConfigurationMap: GraphQLFieldConfigArgumentMap = {};

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
    type: queryHandler.type === 'stream' ? new GraphQLList(resultGraphqlType) : resultGraphqlType,
    args: argumentConfigurationMap,
    description: queryHandler.getDocumentation?.() ?? 'No documentation available.',
    async resolve (source, { options: rawOptions }, { clientMetadata }): Promise<any> {
      const options = addMissingPrototype({ value: rawOptions });

      switch (queryHandler.type) {
        case 'value': {
          const queryResultItem = await executeValueQueryHandler({
            application,
            queryHandlerIdentifier: { view: { name: viewName }, name: queryName },
            options,
            services: {
              client: getClientService({ clientMetadata })
            }
          });

          return queryResultItem;
        }
        case 'stream': {
          const queryResultStream = await executeStreamQueryHandler({
            application,
            queryHandlerIdentifier: { view: { name: viewName }, name: queryName },
            options,
            services: {
              client: getClientService({ clientMetadata })
            }
          });

          const queryResultItems = [];

          for await (const queryResultItem of queryResultStream) {
            queryResultItems.push(queryResultItem);
          }

          return queryResultItems;
        }
        default: {
          throw new errors.InvalidOperation();
        }
      }
    }
  };
};

export { getQueryFieldConfiguration };
