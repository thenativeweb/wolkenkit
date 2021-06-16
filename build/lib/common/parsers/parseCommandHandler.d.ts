import { CommandHandler } from '../../wolkenkit';
import { Result } from 'defekt';
import * as errors from '../errors';
declare const parseCommandHandler: ({ commandHandler }: {
    commandHandler: any;
}) => Result<CommandHandler<any, any, any>, errors.CommandHandlerMalformed>;
export { parseCommandHandler };
