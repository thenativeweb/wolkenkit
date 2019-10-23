import { AggregateDefinition } from '../elements/AggregateDefinition';
import { CommandsDomainDescription } from '../elements/Descriptions';
import errors from '../errors';
import exists from '../utils/fs/exists';
import { promises as fs } from 'fs';
import path from 'path';
import { stripIndent } from 'common-tags';
import validateAggregateDefinition from '../validators/validateAggregateDefinition';

const getCommandsDescription = async function ({ domainDirectory }: {
  domainDirectory: string;
}): Promise<CommandsDomainDescription> {
  if (!await exists({ path: domainDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/server/domain' not found.`);
  }

  const commandsDescription: CommandsDomainDescription = {
    domain: {
      contexts: {}
    }
  };

  for (const contextDirectory of await fs.readdir(domainDirectory, { withFileTypes: true })) {
    if (!contextDirectory.isDirectory()) {
      continue;
    }

    const contextPath = path.join(domainDirectory, contextDirectory.name);
    const contextName = contextDirectory.name;

    commandsDescription.domain.contexts[contextName] = {
      aggregates: {}
    };

    for (const aggregateEntry of await fs.readdir(contextPath, { withFileTypes: true })) {
      let aggregateName,
          aggregatePath;

      if (aggregateEntry.isFile() && path.extname(aggregateEntry.name) === '.js') {
        aggregateName = path.basename(aggregateEntry.name, '.js');
        aggregatePath = path.join(contextPath, aggregateEntry.name);
      } else if (aggregateEntry.isDirectory()) {
        aggregateName = aggregateEntry.name;
        aggregatePath = path.join(contextPath, aggregateEntry.name, 'index.js');

        if (!await exists({ path: aggregatePath })) {
          throw new errors.FileNotFound(`File '<app>/server/domain/${contextName}/${aggregateName}/index.js' not found.`);
        }
      } else {
        continue;
      }

      const importedAggregateDefinition = await import(aggregatePath);

      try {
        validateAggregateDefinition({
          aggregateDefinition: importedAggregateDefinition
        });
      } catch (ex) {
        throw new errors.AggregateDefinitionMalformed(`Aggregate definition '<app>/server/domain/${contextName}/${aggregateName}' is malformed: ${ex.message}`);
      }

      const aggregateDefinition = importedAggregateDefinition as AggregateDefinition;

      commandsDescription.
        domain.
        contexts[contextName].
        aggregates[aggregateName] = {
          commands: {}
        };

      for (const [ commandName, commandHandler ] of Object.entries(aggregateDefinition.commands)) {
        const documentation = commandHandler.getDocumentation ?
          stripIndent(commandHandler.getDocumentation().trim()) :
          undefined;

        const schema = commandHandler.getSchema ?
          commandHandler.getSchema() :
          undefined;

        commandsDescription.
          domain.
          contexts[contextName].
          aggregates[aggregateName].
          commands[commandName] = {
            documentation,
            schema
          };
      }
    }
  }

  return commandsDescription;
};

export default getCommandsDescription;
