import { DoesIdentifierMatchItem } from '../DoesIdentifierMatchItem';
import { PostgresConnectionOptions } from '../../utils/postgres/PostgresConnectionOptions';
import { TableNames } from './TableNames';

export interface PostgresPriorityQueueStoreOptions<TItem, TItemIdentifier> {
  type: 'Postgres';
  doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
  expirationTime?: number;
  hostName: string;
  port: number;
  userName: string;
  password: string;
  database: string;
  encryptConnection?: boolean | PostgresConnectionOptions;
  tableNames: TableNames;
}
