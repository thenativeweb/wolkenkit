import { CommandData } from '../elements/CommandData';
import CommandWithMetadata from '../elements/CommandWithMetadata';
import errors from '../errors';
import getCommandWithMetadataSchema from '../schemas/getCommandWithMetadataSchema';
import { Todo } from '../../types/Todo';

const validateCommandWithMetadata = function <TCommandData extends CommandData> ({
  command,
  application
}: {
  command: CommandWithMetadata<TCommandData>;
  application: Todo;
}): void {
  const schema = getCommandWithMetadataSchema();

  try {
    schema.validate(command, { valueName: 'command' });
  } catch (ex) {
    throw new errors.CommandMalformed(ex.message);
  }

  if (
    (command.metadata.causationId && !command.metadata.correlationId) ||
    (!command.metadata.causationId && command.metadata.correlationId)
  ) {
    throw new errors.CommandMalformed('Causation id and correlation id must either be given both or none.');
  }

  // TODO: Validate command against application
  //       - Context, Aggregate, Commandname
  //       - Validate data against commandhandler.schema
};

export default validateCommandWithMetadata;
