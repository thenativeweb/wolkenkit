import { CommandData } from '../elements/CommandData';
import { CommandDefinitions } from './CommandDefinitions';
import { CommandHandler } from '../elements/CommandHandler';
import errors from '../errors';
import exists from '../utils/fs/exists';
import { promises as fs } from 'fs';
import path from 'path';
import { State } from '../elements/State';
import validateAggregateDefinition from '../validators/validateAggregateDefinition';

const getCommandDefinitions = async function ({ domainDirectory }: {
  domainDirectory: string;
}): Promise<CommandDefinitions> {
  if (!await exists({ path: domainDirectory })) {
    throw new errors.DirectoryNotFound(`Directory '<app>/server/domain' not found.`);
  }

  const commandDefinitions: CommandDefinitions = {};

  for (const contextDirectory of await fs.readdir(domainDirectory, { withFileTypes: true })) {
    if (!contextDirectory.isDirectory()) {
      continue;
    }

    const contextPath = path.join(domainDirectory, contextDirectory.name);
    const contextName = contextDirectory.name;

    commandDefinitions[contextName] = {};

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

      const aggregateDefinition = importedAggregateDefinition as {
        commands: Record<string, CommandHandler<State, CommandData>>;
      };

      commandDefinitions[contextName][aggregateName] = {};

      for (const [ commandName, commandHandler ] of Object.entries(aggregateDefinition.commands)) {
        commandDefinitions[contextName][aggregateName][commandName] = commandHandler;
      }
    }
  }

  return commandDefinitions;
};

export default getCommandDefinitions;
