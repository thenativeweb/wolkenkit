import { RootOptions } from '../../../RootOptions';
export interface PriorityQueueMySqlOptions extends RootOptions {
    'host-name': string;
    port: number;
    'user-name': string;
    password: string;
    database: string;
    'table-name-items': string;
    'table-name-priority-queue': string;
}
