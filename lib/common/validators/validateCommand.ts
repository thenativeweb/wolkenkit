import Command from '../elements/Command';
import { CommandData } from '../elements/CommandData';
import errors from '../errors';
import getCommandSchema from '../schemas/getCommandSchema';
import { Todo } from '../../types/Todo';

const validateCommand = function <TCommandData extends CommandData> ({
  command,
  application
}: {
  command: Command<TCommandData>;
  application: Todo;
}): void {
  const schema = getCommandSchema();

  try {
    schema.validate(command, { valueName: 'command' });
  } catch (ex) {
    throw new errors.CommandMalformed(ex.message);
  }

  // TODO: Validate command against application
  //       - Context, Aggregate, Commandname
  //       - Validate data against commandhandler.schema
};

export default validateCommand;
