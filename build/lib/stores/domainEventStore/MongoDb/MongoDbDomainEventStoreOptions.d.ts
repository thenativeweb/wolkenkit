import { CollectionNames } from './CollectionNames';
export interface MongoDbDomainEventStoreOptions {
    type: 'MongoDb';
    connectionString: string;
    collectionNames: CollectionNames;
}
