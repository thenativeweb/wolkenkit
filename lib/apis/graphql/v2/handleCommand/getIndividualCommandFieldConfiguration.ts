import { addMissingPrototype } from '../../../../common/utils/graphql/addMissingPrototype';
import { AggregateIdentifier } from '../../../../common/elements/AggregateIdentifier';
import { AggregateIdentifierInputType } from './AggregateIdentifierInputType';
import { AggregateIdentifierType } from './AggregateIdentifierType';
import { Application } from '../../../../common/application/Application';
import { cloneDeep } from 'lodash';
import { Command } from '../../../../common/elements/Command';
import { CommandHandler } from '../../../../common/elements/CommandHandler';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
import { flaschenpost } from 'flaschenpost';
import { getCommandSchema } from '../../../../common/schemas/getCommandSchema';
import { getGraphqlSchemaFromJsonSchema } from 'get-graphql-from-jsonschema';
import { instantiateGraphqlTypeDefinitions } from '../../shared/instantiateGraphqlTypeDefinitions';
import { OnReceiveCommand } from '../../OnReceiveCommand';
import { Parser } from 'validate-value';
import { ResolverContext } from '../ResolverContext';
import { v4 } from 'uuid';
import { validateCommand } from '../../../../common/validators/validateCommand';
import { withLogMetadata } from '../../../../common/utils/logging/withLogMetadata';
import {
  GraphQLArgumentConfig,
  GraphQLFieldConfig,
  GraphQLInputType,
  GraphQLObjectType,
  GraphQLString
} from 'graphql';
import * as errors from '../../../../common/errors';

const logger = flaschenpost.getLogger();
const commandSchema = new Parser(getCommandSchema());

const getIndividualCommandFieldConfiguration = function ({
  application,
  contextName,
  aggregateName,
  commandName,
  commandHandler,
  onReceiveCommand
}: {
  application: Application;
  contextName: string;
  aggregateName: string;
  commandName: string;
  commandHandler: CommandHandler<any, any, any>;
  onReceiveCommand: OnReceiveCommand;
}): GraphQLFieldConfig<{ aggregateIdentifier: AggregateIdentifier }, ResolverContext> {
  const resolverArguments: Record<string, GraphQLArgumentConfig> = {
    aggregateIdentifier: {
      type: AggregateIdentifierInputType
    }
  };

  if (!commandHandler.getSchema) {
    throw new errors.GraphQlError(`Schema in command '${contextName}.${aggregateName}.${commandName}' is missing, but required for GraphQL.`);
  }

  const schema = commandHandler.getSchema();

  if (!('type' in schema && schema.type === 'object' && Object.keys(schema.properties).length === 0)) {
    const typeDefs = getGraphqlSchemaFromJsonSchema({
      schema: commandHandler.getSchema(),
      rootName: `${contextName}_${aggregateName}_${commandName}`,
      direction: 'input'
    });

    resolverArguments.data = {
      type: instantiateGraphqlTypeDefinitions(typeDefs) as GraphQLInputType
    };
  }

  return {
    type: new GraphQLObjectType({
      name: `${contextName}_${aggregateName}_${commandName}`,
      fields: {
        id: {
          type: GraphQLString
        },
        aggregateIdentifier: {
          type: AggregateIdentifierType
        }
      }
    }),
    args: resolverArguments,
    description: commandHandler.getDocumentation?.() ?? 'No documentation available.',
    async resolve (
      source,
      { aggregateIdentifier, data: rawData },
      { clientMetadata }
    ): Promise<{ id: string; aggregateIdentifier: { id: string }}> {
      const data = addMissingPrototype({ value: rawData });

      const aggregateId = aggregateIdentifier?.id ?? v4();

      const command = new Command({
        aggregateIdentifier: {
          context: { name: contextName },
          aggregate: { name: aggregateName, id: aggregateId }
        },
        name: commandName,
        data: data === undefined ? {} : cloneDeep(data)
      });

      commandSchema.parse(
        command,
        { valueName: 'command' }
      ).unwrapOrThrow(
        (err): Error => new errors.CommandMalformed(err.message)
      );
      validateCommand({ command, application });

      const commandId = v4();
      const commandWithMetadata = new CommandWithMetadata({
        ...command,
        id: commandId,
        metadata: {
          causationId: commandId,
          correlationId: commandId,
          timestamp: Date.now(),
          client: clientMetadata,
          initiator: { user: clientMetadata.user }
        }
      });

      logger.debug(
        'Received command.',
        withLogMetadata('api', 'graphql', { command: commandWithMetadata })
      );

      await onReceiveCommand({ command: commandWithMetadata });

      return {
        id: commandId,
        aggregateIdentifier: {
          id: commandWithMetadata.aggregateIdentifier.aggregate.id
        }
      };
    }
  };
};

export { getIndividualCommandFieldConfiguration };
