import { RootOptions } from '../../../RootOptions';
export interface LockMySqlOptions extends RootOptions {
    'host-name': string;
    port: number;
    'user-name': string;
    password: string;
    database: string;
    'table-name-locks': string;
}
