import { CollectionNames } from './CollectionNames';

export interface MongoDbLockStoreOptions {
  type: 'MongoDb';
  hostName: string;
  port: number;
  userName: string;
  password: string;
  database: string;
  collectionNames: CollectionNames;
}
