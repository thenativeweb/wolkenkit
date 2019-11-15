import { ApplicationDefinition } from '../application/ApplicationDefinition';
import { CommandData } from '../elements/CommandData';
import { CommandWithMetadata } from '../elements/CommandWithMetadata';
import { errors } from '../errors';
import { getCommandWithMetadataSchema } from '../schemas/getCommandWithMetadataSchema';
import { Value } from 'validate-value';

const validateCommandWithMetadata = function <TCommandData extends CommandData> ({
  command,
  applicationDefinition
}: {
  command: CommandWithMetadata<TCommandData>;
  applicationDefinition: ApplicationDefinition;
}): void {
  const schema = getCommandWithMetadataSchema();

  try {
    schema.validate(command, { valueName: 'command' });
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

export { validateCommandWithMetadata };
