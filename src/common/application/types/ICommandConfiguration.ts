import CommandInternal from '../../elements/CommandInternal';
import { Dictionary } from '../../../types/Dictionary';

export interface ICommandConfiguration {
  documentation?: string;
  schema?: {};
  isAuthorized (aggregate: AggregateApiForReadOnly, command: CommandInternal): boolean;
  handle (aggregate: AggregateApiForCommands): void | Promise<void>;
}
