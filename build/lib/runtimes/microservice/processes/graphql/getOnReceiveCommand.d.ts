import { CommandDispatcher } from './CommandDispatcher';
import { OnReceiveCommand } from '../../../../apis/handleCommand/OnReceiveCommand';
declare const getOnReceiveCommand: ({ commandDispatcher }: {
    commandDispatcher: CommandDispatcher;
}) => OnReceiveCommand;
export { getOnReceiveCommand };
