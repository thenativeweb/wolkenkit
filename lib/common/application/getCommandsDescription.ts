import { CommandsDescription } from './CommandsDescription';
import { DomainDefinition } from './DomainDefinition';
import { stripIndent } from 'common-tags';

const getCommandsDescription = function ({ domainDefinition }: {
  domainDefinition: DomainDefinition;
}): CommandsDescription {
  const commandsDescription: CommandsDescription = {};

  for (const [ contextName, contextDefinition ] of Object.entries(domainDefinition)) {
    commandsDescription[contextName] = {};

    for (const [ aggregateName, aggregateDefinition ] of Object.entries(contextDefinition)) {
      commandsDescription[contextName][aggregateName] = {};

      for (const [ commandName, commandHandler ] of Object.entries(aggregateDefinition.commandHandlers)) {
        const { getDocumentation, getSchema } = commandHandler;

        commandsDescription[contextName][aggregateName][commandName] = {
          documentation: getDocumentation ? stripIndent(getDocumentation().trim()) : undefined,
          schema: getSchema ? getSchema() : undefined
        };
      }
    }
  }

  return commandsDescription;
};

export { getCommandsDescription };
