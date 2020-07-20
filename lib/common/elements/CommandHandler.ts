import { AggregateService } from '../services/AggregateService';
import { AggregatesService } from '../services/AggregatesService';
import { AskInfrastructure } from './AskInfrastructure';
import { ClientService } from '../services/ClientService';
import { CommandData } from './CommandData';
import { CommandWithMetadata } from './CommandWithMetadata';
import { ErrorService } from '../services/ErrorService';
import { LockService } from '../services/LockService';
import { LoggerService } from '../services/LoggerService';
import { Schema } from './Schema';
import { State } from './State';
import { TellInfrastructure } from './TellInfrastructure';

export interface CommandHandler<
  TState extends State,
  TCommandData extends CommandData,
  TInfrastructure extends AskInfrastructure & TellInfrastructure
> {
  getDocumentation? (): string;

  getSchema? (): Schema;

  isAuthorized (state: TState, command: CommandWithMetadata<TCommandData>, services: {
    aggregates: AggregatesService;
    client: ClientService;
    logger: LoggerService;
    infrastructure: Pick<TInfrastructure, 'ask'>;
  }): boolean | Promise<boolean>;

  handle (state: TState, command: CommandWithMetadata<TCommandData>, services: {
    aggregate: AggregateService<TState>;
    aggregates: AggregatesService;
    client: ClientService;
    error: ErrorService<'CommandRejected'>;
    lock: LockService;
    logger: LoggerService;
    infrastructure: TInfrastructure;
  }): void | Promise<void>;
}
