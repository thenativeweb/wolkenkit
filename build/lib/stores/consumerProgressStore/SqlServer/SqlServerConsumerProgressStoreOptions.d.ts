import { TableNames } from './TableNames';
export interface SqlServerConsumerProgressStoreOptions {
    type: 'SqlServer';
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    tableNames: TableNames;
}
