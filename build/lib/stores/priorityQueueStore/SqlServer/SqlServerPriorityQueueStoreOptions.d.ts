import { DoesIdentifierMatchItem } from '../DoesIdentifierMatchItem';
import { TableNames } from './TableNames';
export interface SqlServerPriorityQueueStoreOptions<TItem, TItemIdentifier> {
    type: 'SqlServer';
    doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
    expirationTime?: number;
    hostName: string;
    port: number;
    userName: string;
    password: string;
    database: string;
    encryptConnection?: boolean;
    tableNames: TableNames;
}
