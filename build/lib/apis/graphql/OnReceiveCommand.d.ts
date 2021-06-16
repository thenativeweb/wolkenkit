import { CommandData } from '../../common/elements/CommandData';
import { CommandWithMetadata } from '../../common/elements/CommandWithMetadata';
export declare type OnReceiveCommand = ({ command }: {
    command: CommandWithMetadata<CommandData>;
}) => Promise<void>;
