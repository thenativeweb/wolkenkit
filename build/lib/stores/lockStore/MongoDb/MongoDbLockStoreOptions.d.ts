import { CollectionNames } from './CollectionNames';
export interface MongoDbLockStoreOptions {
    type: 'MongoDb';
    connectionString: string;
    collectionNames: CollectionNames;
}
