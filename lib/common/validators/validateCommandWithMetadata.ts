import { Application } from '../application/Application';
import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { parse } from 'validate-value';
import * as errors from '../errors';

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

  parse(
    commandData,
    commandHandler.getSchema(),
    { valueName: 'command.data' }
  ).unwrapOrThrow(
    (err): Error => new errors.CommandMalformed({ message: err.message, cause: err })
  );
};

export { validateCommandWithMetadata };
