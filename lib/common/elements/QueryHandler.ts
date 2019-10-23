import { Readable } from 'stream';
import { Schema } from './Schema';
import { Todo } from '../../types/Todo';

export interface QueryHandler<TDatabaseView, TQueryOptions, TResult> {
  getDocumentation? (): string;

  getOptionsSchema? (): Schema;

  getItemSchema? (): Schema;

  handle (databaseView: TDatabaseView, queryOptions: TQueryOptions, services: Todo): Readable | Promise<Readable>;

  isAuthorized (databaseViewItem: TResult, services: Todo): boolean | Promise<boolean>;
}
