import { InMemoryConsumerProgressStoreOptions } from './InMemory';
import { MongoDbConsumerProgressStoreOptions } from './MongoDb';
import { MySqlConsumerProgressStoreOptions } from './MySql';
import { PostgresConsumerProgressStoreOptions } from './Postgres';
import { SqlServerConsumerProgressStoreOptions } from './SqlServer';

export type ConsumerProgressStoreOptions =
  InMemoryConsumerProgressStoreOptions |
  MongoDbConsumerProgressStoreOptions |
  MySqlConsumerProgressStoreOptions |
  PostgresConsumerProgressStoreOptions |
  SqlServerConsumerProgressStoreOptions;
