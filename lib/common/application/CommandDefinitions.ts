import { CommandData } from '../elements/CommandData';
import { CommandHandler } from '../elements/CommandHandler';
import { State } from '../elements/State';

export type CommandDefinitions = Record<string, Record<string, Record<string, CommandHandler<State, CommandData>>>>;
