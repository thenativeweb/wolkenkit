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

        const description = {} as any;

        if (getDocumentation) {
          description.documentation = stripIndent(getDocumentation().trim());
        }
        if (getSchema) {
          description.schema = getSchema();
        }

        commandsDescription[contextName][aggregateName][commandName] = description;
      }
    }
  }

  return commandsDescription;
};

export { getCommandsDescription };
