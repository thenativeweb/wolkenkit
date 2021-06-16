import { Application } from '../application/Application';
import { Command } from '../elements/Command';
import { CommandData } from '../elements/CommandData';
import { parse } from 'validate-value';
import * as errors from '../errors';

const validateCommand = function <TCommandData extends CommandData> ({
  command,
  application
}: {
  command: Command<TCommandData>;
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

export { validateCommand };
