import { AskInfrastructure } from './AskInfrastructure';
import { ClientService } from '../services/ClientService';
import { ErrorService } from '../services/ErrorService';
import { LoggerService } from '../services/LoggerService';
import { QueryOptions } from './QueryOptions';
import { QueryResultItem } from './QueryResultItem';
import { Schema } from './Schema';
import { TellInfrastructure } from './TellInfrastructure';

export interface QueryHandlerReturnsValue<
  TQueryResultItem extends QueryResultItem,
  TInfrastructure extends AskInfrastructure & TellInfrastructure,
  TQueryOptions extends QueryOptions = QueryOptions
> {
  type: 'value';

  handle: (options: TQueryOptions, services: {
    client: ClientService;
    error: ErrorService<'NotFound'>;
    infrastructure: Pick<TInfrastructure, 'ask'>;
    logger: LoggerService;
  }) => TQueryResultItem | Promise<TQueryResultItem>;

  getDocumentation?: () => string;

  getOptionsSchema?: () => Schema;

  getResultItemSchema?: () => Schema;

  isAuthorized: (databaseViewItem: TQueryResultItem, services: {
    client: ClientService;
    logger: LoggerService;
  }) => boolean | Promise<boolean>;
}
