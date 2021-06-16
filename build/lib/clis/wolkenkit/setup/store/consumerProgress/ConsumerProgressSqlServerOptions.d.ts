import { RootOptions } from '../../../RootOptions';
export interface ConsumerProgressSqlServerOptions extends RootOptions {
    'host-name': string;
    port: number;
    'user-name': string;
    password: string;
    database: string;
    'table-name-progress': string;
    'encrypt-connection'?: boolean;
}
