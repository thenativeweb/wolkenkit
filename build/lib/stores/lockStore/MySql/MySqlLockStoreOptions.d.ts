import { TableNames } from './TableNames';
export interface MySqlLockStoreOptions {
    type: 'MariaDb' | 'MySql';
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    tableNames: TableNames;
}
