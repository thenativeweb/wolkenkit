import { RootOptions } from '../../../RootOptions';
export interface DomainEventMySqlOptions extends RootOptions {
    'host-name': string;
    port: number;
    'user-name': string;
    password: string;
    database: string;
    'table-name-domain-events': string;
    'table-name-snapshots': string;
}
