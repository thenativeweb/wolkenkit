import { RootOptions } from '../../../RootOptions';
export interface LockRedisOptions extends RootOptions {
    'host-name': string;
    port: number;
    password: string;
    database: number;
    'list-name-locks': string;
}
