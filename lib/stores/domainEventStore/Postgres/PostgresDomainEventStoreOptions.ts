import { ConnectionOptions } from 'tls';
import { TableNames } from './TableNames';

export interface PostgresDomainEventStoreOptions {
  type: 'Postgres';
  hostName: string;
  port: number;
  userName: string;
  password: string;
  database: string;
  encryptConnection?: boolean | ConnectionOptions;
  tableNames: TableNames;
}
