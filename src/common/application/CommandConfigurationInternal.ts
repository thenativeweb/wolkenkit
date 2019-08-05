import AggregateApiForCommands from '../elements/AggregateApiForCommands';
import AggregateApiForReadOnly from '../elements/AggregateApiForReadOnly';
import { ClientService } from '../services/ClientService';
import { CommandConfigurationExternal } from './CommandConfigurationExternal';
import CommandInternal from '../elements/CommandInternal';
import { LoggerService } from '../services/LoggerService';

export interface CommandConfigurationInternal extends CommandConfigurationExternal {
  isAuthorized (
    aggregate: AggregateApiForReadOnly,
    command: CommandInternal,
    services: {
      client: ClientService,
      logger: LoggerService
    }
  ): boolean | Promise<boolean>;

  handle (
    aggregate: AggregateApiForCommands,
    command: CommandInternal,
    services: {
      client: ClientService,
      logger: LoggerService
    }
  ): void | Promise<void>;
}
