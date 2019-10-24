import { CommandDefinitions } from './CommandDefinitions';
import { CommandDescriptions } from './CommandDescriptions';
import { stripIndent } from 'common-tags';

const getCommandDescriptions = function ({ commandDefinitions }: {
  commandDefinitions: CommandDefinitions;
}): CommandDescriptions {
  const commandDescriptions: CommandDescriptions = {};

  for (const [ contextName, contextDefinition ] of Object.entries(commandDefinitions)) {
    commandDescriptions[contextName] = {};

    for (const [ aggregateName, aggregateDefinition ] of Object.entries(contextDefinition)) {
      commandDescriptions[contextName][aggregateName] = {};

      for (const [ commandName, commandDefinition ] of Object.entries(aggregateDefinition)) {
        const { getDocumentation, getSchema } = commandDefinition;

        commandDescriptions[contextName][aggregateName][commandName] = {
          documentation: getDocumentation ? stripIndent(getDocumentation().trim()) : undefined,
          schema: getSchema ? getSchema() : undefined
        };
      }
    }
  }

  return commandDescriptions;
};

export { getCommandDescriptions };
