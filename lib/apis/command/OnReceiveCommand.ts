import { CommandWithMetadata } from '../../common/elements/CommandWithMetadata';

export type OnReceiveCommand = ({ command }: {
  command: CommandWithMetadata<any>;
}) => Promise<void>;
