import { PostgresConnectionOptions } from '../../utils/postgres/PostgresConnectionOptions';
import { TableNames } from './TableNames';

export interface PostgresDomainEventStoreOptions {
  type: 'Postgres';
  hostName: string;
  port: number;
  userName: string;
  password: string;
  database: string;
  encryptConnection?: boolean | PostgresConnectionOptions;
  tableNames: TableNames;
}
