import AggregateApiForCommands from '../../elements/AggregateApiForCommands';
import AggregateApiForReadOnly from '../../elements/AggregateApiForReadOnly';
import CommandInternal from '../../elements/CommandInternal';
import { ICommandConfigurationExternal } from './ICommandConfigurationExternal';
import { IServices } from '../../services/types/IServices';

export interface ICommandConfigurationInternal extends ICommandConfigurationExternal {
  isAuthorized (aggregate: AggregateApiForReadOnly, command: CommandInternal, services: IServices): boolean | Promise<boolean>;
  handle (aggregate: AggregateApiForCommands, command: CommandInternal, services: IServices): void | Promise<void>;
}
