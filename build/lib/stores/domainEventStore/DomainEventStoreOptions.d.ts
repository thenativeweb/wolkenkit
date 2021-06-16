import { InMemoryDomainEventStoreOptions } from './InMemory';
import { MongoDbDomainEventStoreOptions } from './MongoDb';
import { MySqlDomainEventStoreOptions } from './MySql';
import { PostgresDomainEventStoreOptions } from './Postgres';
import { SqlServerDomainEventStoreOptions } from './SqlServer';
export declare type DomainEventStoreOptions = InMemoryDomainEventStoreOptions | MongoDbDomainEventStoreOptions | MySqlDomainEventStoreOptions | PostgresDomainEventStoreOptions | SqlServerDomainEventStoreOptions;
