import { CommandData } from '../../../../common/elements/CommandData';
import { CommandDispatcher } from './CommandDispatcher';
import { CommandWithMetadata } from '../../../../common/elements/CommandWithMetadata';
declare const keepRenewingLock: ({ command, handleCommandPromise, commandDispatcher, token }: {
    command: CommandWithMetadata<CommandData>;
    handleCommandPromise: Promise<any>;
    commandDispatcher: CommandDispatcher;
    token: string;
}) => Promise<void>;
export { keepRenewingLock };
