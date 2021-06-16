import { DoesIdentifierMatchItem } from '../DoesIdentifierMatchItem';
import { TableNames } from './TableNames';
export interface MySqlPriorityQueueStoreOptions<TItem, TItemIdentifier> {
    type: 'MySql' | 'MariaDb';
    doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
    expirationTime?: number;
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    tableNames: TableNames;
}
