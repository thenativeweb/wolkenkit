import { AggregateService } from '../services/AggregateService';
import { AggregatesService } from '../services/AggregatesService';
import { ClientService } from '../services/ClientService';
import { Command } from './Command';
import { CommandData } from './CommandData';
import { LoggerService } from '../services/LoggerService';
import { Schema } from './Schema';
import { State } from './State';

export interface CommandHandler<TState extends State, TCommandData extends CommandData> {
  getDocumentation? (): string;

  getSchema? (): Schema;

  isAuthorized (state: TState, command: Command<TCommandData>, services: {
    aggregates: AggregatesService;
    client: ClientService;
    logger: LoggerService;
  }): boolean | Promise<boolean>;

  handle (state: TState, command: Command<TCommandData>, services: {
    aggregate: AggregateService;
    aggregates: AggregatesService;
    client: ClientService;
    logger: LoggerService;
  }): void | Promise<void>;
}
