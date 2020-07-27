import { CollectionNames } from './CollectionNames';

export interface MongoDbDomainEventStoreOptions {
  connectionString: string;
  collectionNames: CollectionNames;
}
