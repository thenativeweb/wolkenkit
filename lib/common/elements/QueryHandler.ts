import { AskInfrastructure } from '../elements/AskInfrastructure';
import { ClientService } from '../services/ClientService';
import { LoggerService } from '../services/LoggerService';
import { QueryOptions } from './QueryOptions';
import { QueryResultItem } from './QueryResultItem';
import { Readable } from 'stream';
import { Schema } from './Schema';

interface QueryHandlerReturnsValue<
  TQueryResultItem extends QueryResultItem,
  TInfrastructure extends AskInfrastructure,
  TQueryOptions extends QueryOptions
> {
  type: 'value';

  handle (options: TQueryOptions, services: {
    client: ClientService;
    infrastructure: TInfrastructure;
    logger: LoggerService;
  }): TQueryResultItem | Promise<TQueryResultItem>;
}

interface QueryHandlerReturnsStream<
  TInfrastructure extends AskInfrastructure,
  TQueryOptions extends QueryOptions
> {
  type: 'stream';

  handle (options: TQueryOptions, services: {
    client: ClientService;
    infrastructure: TInfrastructure;
    logger: LoggerService;
  }): Readable | Promise<Readable>;
}

export type QueryHandler<
  TQueryResultItem extends QueryResultItem,
  TInfrastructure extends AskInfrastructure,
  TQueryOptions extends QueryOptions = QueryOptions
> = {
  getDocumentation? (): string;

  getOptionsSchema? (): Schema;

  getResultItemSchema? (): Schema;

  isAuthorized (databaseViewItem: TQueryResultItem, services: {
    client: ClientService;
    logger: LoggerService;
  }): boolean | Promise<boolean>;
} & (
  QueryHandlerReturnsValue<TQueryResultItem, TInfrastructure, TQueryOptions> |
  QueryHandlerReturnsStream<TInfrastructure, TQueryOptions>
);
