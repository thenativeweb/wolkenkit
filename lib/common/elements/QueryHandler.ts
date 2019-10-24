import { ClientService } from '../services/ClientService';
import { LoggerService } from '../services/LoggerService';
import { Readable } from 'stream';
import { Schema } from './Schema';

export interface QueryHandler<TDatabaseView, TQueryOptions, TResult> {
  getDocumentation? (): string;

  getOptionsSchema? (): Schema;

  getItemSchema? (): Schema;

  handle (databaseView: TDatabaseView, queryOptions: TQueryOptions, services: {
    client: ClientService;
    logger: LoggerService;
  }): Readable | Promise<Readable>;

  isAuthorized (databaseViewItem: TResult, services: {
    client: ClientService;
    logger: LoggerService;
  }): boolean | Promise<boolean>;
}
