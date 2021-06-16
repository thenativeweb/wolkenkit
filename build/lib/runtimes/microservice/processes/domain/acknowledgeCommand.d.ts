import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDispatcher } from './CommandDispatcher';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
declare const acknowledgeCommand: ({ command, token, commandDispatcher }: {
    command: CommandWithMetadata<CommandData>;
    token: string;
    commandDispatcher: CommandDispatcher;
}) => Promise<void>;
export { acknowledgeCommand };
