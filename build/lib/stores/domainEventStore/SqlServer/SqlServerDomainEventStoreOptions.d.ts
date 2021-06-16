import { TableNames } from './TableNames';
export interface SqlServerDomainEventStoreOptions {
    type: 'SqlServer';
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    tableNames: TableNames;
}
