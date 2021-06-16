import { TableNames } from './TableNames';
export interface SqlServerLockStoreOptions {
    type: 'SqlServer';
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    tableNames: TableNames;
}
