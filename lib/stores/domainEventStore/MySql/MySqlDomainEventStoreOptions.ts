import { TableNames } from './TableNames';

export interface MySqlDomainEventStoreOptions {
  hostName: string;
  port: number;
  userName: string;
  password: string;
  database: string;
  tableNames: TableNames;
}
