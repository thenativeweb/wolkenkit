import { TableNames } from './TableNames';

export interface SqlServerLockStoreOptions {
  hostName: string;
  port: number;
  userName: string;
  password: string;
  database: string;
  encryptConnection?: boolean;
  tableNames: TableNames;
}
