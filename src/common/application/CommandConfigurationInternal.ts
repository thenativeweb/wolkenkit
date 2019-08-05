import AggregateApiForCommands from '../elements/AggregateApiForCommands';
import AggregateApiForReadOnly from '../elements/AggregateApiForReadOnly';
import { CommandConfigurationExternal } from './CommandConfigurationExternal';
import CommandInternal from '../elements/CommandInternal';
import { Services } from '../services/Services';

export interface CommandConfigurationInternal extends CommandConfigurationExternal {
  isAuthorized (aggregate: AggregateApiForReadOnly, command: CommandInternal, services: Services): boolean | Promise<boolean>;
  handle (aggregate: AggregateApiForCommands, command: CommandInternal, services: Services): void | Promise<void>;
}
