import { AggregateService } from '../services/AggregateService';
import { AggregatesService } from '../services/AggregatesService';
import { ClientService } from '../services/ClientService';
import { CommandData } from './CommandData';
import { CommandWithMetadata } from './CommandWithMetadata';
import { ErrorService } from '../services/ErrorService';
import { LockService } from '../services/LockService';
import { LoggerService } from '../services/LoggerService';
import { Schema } from './Schema';
import { State } from './State';

export interface CommandHandler<TState extends State, TCommandData extends CommandData> {
  getDocumentation? (): string;

  getSchema? (): Schema;

  isAuthorized (state: TState, command: CommandWithMetadata<TCommandData>, services: {
    aggregates: AggregatesService;
    client: ClientService;
    logger: LoggerService;
  }): boolean | Promise<boolean>;

  handle (state: TState, command: CommandWithMetadata<TCommandData>, services: {
    aggregate: AggregateService<TState>;
    aggregates: AggregatesService;
    client: ClientService;
    error: ErrorService;
    lock: LockService;
    logger: LoggerService;
  }): void | Promise<void>;
}
