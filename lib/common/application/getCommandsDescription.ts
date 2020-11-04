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
        const description = {} as any;

        if (commandHandler.getDocumentation) {
          description.documentation = stripIndent(commandHandler.getDocumentation().trim());
        }
        if (commandHandler.getSchema) {
          description.schema = commandHandler.getSchema();
        }

        commandsDescription[contextName][aggregateName][commandName] = description;
      }
    }
  }

  return commandsDescription;
};

export { getCommandsDescription };
