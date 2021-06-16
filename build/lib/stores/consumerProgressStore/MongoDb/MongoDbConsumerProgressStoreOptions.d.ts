import { CollectionNames } from './CollectionNames';
export interface MongoDbConsumerProgressStoreOptions {
    type: 'MongoDb';
    connectionString: string;
    collectionNames: CollectionNames;
}
