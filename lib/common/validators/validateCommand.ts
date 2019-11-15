import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { Command } from '../elements/Command';
import { CommandData } from '../elements/CommandData';
import { errors } from '../errors';
import { getCommandSchema } from '../schemas/getCommandSchema';
import { Value } from 'validate-value';

const validateCommand = function <TCommandData extends CommandData> ({
  command,
  applicationDefinition
}: {
  command: Command<TCommandData>;
  applicationDefinition: ApplicationDefinition;
}): void {
  const schemaCommand = getCommandSchema();

  try {
    schemaCommand.validate(command, { valueName: 'command' });
  } catch (ex) {
    throw new errors.CommandMalformed(ex.message);
  }

  const contextDefinitions = applicationDefinition.domain;

  const {
    contextIdentifier: { name: contextName },
    aggregateIdentifier: { name: aggregateName },
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

  const { getSchema } = contextDefinitions[contextName][aggregateName].commandHandlers[commandName];

  if (!getSchema) {
    return;
  }

  const schemaData = new Value(getSchema());

  try {
    schemaData.validate(commandData, { valueName: 'command.data' });
  } catch (ex) {
    throw new errors.CommandMalformed(ex.message, { cause: ex });
  }
};

export { validateCommand };
