import { Command } from '../elements/Command';
import { CommandData } from '../elements/CommandData';
import { Initiator } from '../elements/Initiator';
export interface CommandService {
    issueCommand: <TCommandData extends CommandData>(command: Command<TCommandData>, initiator?: Initiator) => Promise<string>;
}
