import { RootOptions } from '../../../RootOptions';
export interface LockPostgresOptions extends RootOptions {
    'host-name': string;
    port: number;
    'user-name': string;
    password: string;
    database: string;
    'table-name-locks': string;
    'encrypt-connection'?: boolean;
}
