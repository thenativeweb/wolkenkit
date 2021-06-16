import { CommandDispatcher } from './CommandDispatcher';
import { OnCancelCommand } from '../../../../apis/handleCommand/OnCancelCommand';
declare const getOnCancelCommand: ({ commandDispatcher }: {
    commandDispatcher: CommandDispatcher;
}) => OnCancelCommand;
export { getOnCancelCommand };
