import { TableNames } from './TableNames';
export interface MySqlConsumerProgressStoreOptions {
    type: 'MySql' | 'MariaDb';
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    tableNames: TableNames;
}
