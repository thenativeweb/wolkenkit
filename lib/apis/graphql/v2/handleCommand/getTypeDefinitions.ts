import { Application } from '../../../../common/application/Application';
import { errors } from '../../../../common/errors';
import { getGraphqlFromJsonSchema } from 'get-graphql-from-jsonschema';
import { getItemIdentifierSchema } from '../../../../common/schemas/getItemIdentifierSchema';
import { stripIndent } from 'common-tags';

const getTypeDefinitions = function ({ application }: {
  application: Application;
}): string {
  let commandSchema = '';
  const typeDefinitions = [];

  commandSchema += 'type Command {\n';
  for (const [ contextName, context ] of Object.entries(application.domain)) {
    commandSchema += `  ${contextName}: ${contextName}\n`;
    let contextSchema = `type ${contextName} {\n`;

    for (const [ aggregateName, aggregate ] of Object.entries(context)) {
      contextSchema += `  ${aggregateName} (id: String!): ${contextName}_${aggregateName}\n`;
      let aggregateSchema = `type ${contextName}_${aggregateName} {\n`;

      for (const [ commandName, commandHandler ] of Object.entries(aggregate.commandHandlers)) {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        if (!commandHandler.getSchema) {
          throw new errors.GraphQlError(`Schema in command '${contextName}.${aggregateName}.${commandName}' is missing, but required for GraphQL.`);
        }

        const schema = commandHandler.getSchema();

        if (schema.type === 'object' && Object.keys(schema.properties as object).length === 0) {
          aggregateSchema += `  ${commandName}: CommandId\n`;

          continue;
        }

        const typeDefs = getGraphqlFromJsonSchema({
          schema: commandHandler.getSchema(),
          rootName: `${contextName}_${aggregateName}_${commandName}`,
          direction: 'input'
        });

        typeDefinitions.push(...typeDefs.typeDefinitions);
        aggregateSchema += `  ${commandName} (data: ${typeDefs.typeName}!): CommandId\n`;
      }
      aggregateSchema += `}\n`;
      typeDefinitions.push(aggregateSchema);
    }
    contextSchema += `}\n`;
    typeDefinitions.push(contextSchema);
  }
  commandSchema += `}\n`;

  const cancelTypeDefs = getGraphqlFromJsonSchema({
    schema: getItemIdentifierSchema(),
    rootName: 'CommandIdentifier',
    direction: 'input'
  });

  return stripIndent`
    type CommandId  {
      id: String!
    }

    ${typeDefinitions.join('\n')}
    
    ${cancelTypeDefs.typeDefinitions.join('\n')}

    ${commandSchema}

    type Cancel {
      success: Boolean
    }

    type Mutation {
      command: Command
      cancel (commandIdentifier: ${cancelTypeDefs.typeName}!): Cancel
    }
  `;
};

export { getTypeDefinitions };
