import { CommandData } from '../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../lib/common/elements/CommandWithMetadata';
import { ItemIdentifier } from '../../lib/common/elements/ItemIdentifier';

const getItemIdentifierFromCommand = function (command: CommandWithMetadata<CommandData>): ItemIdentifier {
  return {
    contextIdentifier: command.contextIdentifier,
    aggregateIdentifier: command.aggregateIdentifier,
    id: command.id,
    name: command.name
  };
};

export {
  getItemIdentifierFromCommand
};
