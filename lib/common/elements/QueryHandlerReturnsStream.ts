import { AskInfrastructure } from './AskInfrastructure';
import { ClientService } from '../services/ClientService';
import { LoggerService } from '../services/LoggerService';
import { QueryOptions } from './QueryOptions';
import { QueryResultItem } from './QueryResultItem';
import { Readable } from 'stream';
import { Schema } from './Schema';
import { TellInfrastructure } from './TellInfrastructure';

export interface QueryHandlerReturnsStream<
  TQueryResultItem extends QueryResultItem,
  TInfrastructure extends AskInfrastructure & TellInfrastructure,
  TQueryOptions extends QueryOptions = QueryOptions
> {
  type: 'stream';

  handle: (options: TQueryOptions, services: {
    client: ClientService;
    infrastructure: Pick<TInfrastructure, 'ask'>;
    logger: LoggerService;
  }) => Readable | Promise<Readable>;

  getDocumentation?: () => string;

  getOptionsSchema?: () => Schema;

  getResultItemSchema?: () => Schema;

  isAuthorized: (databaseViewItem: TQueryResultItem, services: {
    client: ClientService;
    logger: LoggerService;
  }) => boolean | Promise<boolean>;
}
