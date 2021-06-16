import { TableNames } from './TableNames';
export interface PostgresConsumerProgressStoreOptions {
    type: 'Postgres';
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    tableNames: TableNames;
}
