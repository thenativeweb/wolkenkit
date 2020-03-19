import { CommandData } from '../../common/elements/CommandData';
import { CommandWithMetadata } from '../../common/elements/CommandWithMetadata';

export type OnReceiveCommand = ({ command }: {
  command: CommandWithMetadata<CommandData>;
}) => Promise<void>;
