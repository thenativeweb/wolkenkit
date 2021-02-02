import { Application } from '../application/Application';
import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { errors } from '../errors';
import { Value } from 'validate-value';

const validateCommandWithMetadata = function <TCommandData extends CommandData> ({
  command,
  application
}: {
  command: CommandWithMetadata<TCommandData>;
  application: Application;
}): void {
  const contextDefinitions = application.domain;

  const {
    aggregateIdentifier: {
      context: { name: contextName },
      aggregate: { name: aggregateName }
    },
    name: commandName,
    data: commandData
  } = command;

  if (!(contextName in contextDefinitions)) {
    throw new errors.ContextNotFound(`Context '${contextName}' not found.`);
  }
  if (!(aggregateName in contextDefinitions[contextName])) {
    throw new errors.AggregateNotFound(`Aggregate '${contextName}.${aggregateName}' not found.`);
  }
  if (!(commandName in contextDefinitions[contextName][aggregateName].commandHandlers)) {
    throw new errors.CommandNotFound(`Command '${contextName}.${aggregateName}.${commandName}' not found.`);
  }

  const commandHandler = contextDefinitions[contextName][aggregateName].commandHandlers[commandName];

  if (!commandHandler.getSchema) {
    return;
  }

  const schemaData = new Value(commandHandler.getSchema());

  try {
    schemaData.validate(commandData, { valueName: 'command.data' });
  } catch (ex: unknown) {
    throw new errors.CommandMalformed((ex as Error).message, { cause: ex as Error });
  }
};

export { validateCommandWithMetadata };
