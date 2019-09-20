import AggregateApiForCommands from '../elements/AggregateApiForCommands';
import AggregateApiForReadOnly from '../elements/AggregateApiForReadOnly';
import { AggregateService } from '../services/AggregateService';
import { ClientService } from '../services/ClientService';
import { CommandConfigurationExternal } from './CommandConfigurationExternal';
import CommandInternal from '../elements/CommandInternal';
import { LoggerService } from '../services/LoggerService';

export interface CommandConfigurationInternal extends CommandConfigurationExternal {
  isAuthorized (
    aggregate: AggregateApiForReadOnly,
    command: CommandInternal,
    services: {
      client: ClientService;
      logger: LoggerService;
      app: {
        aggregates: AggregateService;
      };
    }
  ): boolean | Promise<boolean>;

  handle (
    aggregate: AggregateApiForCommands,
    command: CommandInternal,
    services: {
      client: ClientService;
      logger: LoggerService;
      app: {
        aggregates: AggregateService;
      };
    }
  ): void | Promise<void>;
}
