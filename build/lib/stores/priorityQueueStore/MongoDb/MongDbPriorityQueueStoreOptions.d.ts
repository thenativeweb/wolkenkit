import { CollectionNames } from './CollectionNames';
import { DoesIdentifierMatchItem } from '../DoesIdentifierMatchItem';
export interface MongoDbPriorityQueueStoreOptions<TItem, TItemIdentifier> {
    type: 'MongoDb';
    doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
    expirationTime?: number;
    connectionString: string;
    collectionNames: CollectionNames;
}
