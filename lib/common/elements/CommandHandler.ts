import Command from './Command';
import { CommandData } from './CommandData';
import { Schema } from './Schema';
import { State } from './State';
import { Todo } from '../../types/Todo';

export interface CommandHandler<TState extends State, TCommandData extends CommandData> {
  getDocumentation? (): string;

  getSchema? (): Schema;

  isAuthorized (state: TState, command: Command<TCommandData>, service: Todo): boolean | Promise<boolean>;

  handle (state: TState, command: Command<TCommandData>, service: Todo): void | Promise<void>;
}
