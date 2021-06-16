import { InMemoryLockStoreOptions } from './InMemory';
import { MongoDbLockStoreOptions } from './MongoDb';
import { MySqlLockStoreOptions } from './MySql';
import { PostgresLockStoreOptions } from './Postgres';
import { RedisLockStoreOptions } from './Redis';
import { SqlServerLockStoreOptions } from './SqlServer';
export declare type LockStoreOptions = InMemoryLockStoreOptions | MongoDbLockStoreOptions | MySqlLockStoreOptions | PostgresLockStoreOptions | RedisLockStoreOptions | SqlServerLockStoreOptions;
