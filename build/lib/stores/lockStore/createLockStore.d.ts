import { LockStore } from './LockStore';
import { InMemoryLockStoreOptions } from './InMemory';
import { MongoDbLockStoreOptions } from './MongoDb';
import { MySqlLockStoreOptions } from './MySql';
import { PostgresLockStoreOptions } from './Postgres';
import { RedisLockStoreOptions } from './Redis';
import { SqlServerLockStoreOptions } from './SqlServer';
declare const createLockStore: (options: InMemoryLockStoreOptions | MongoDbLockStoreOptions | MySqlLockStoreOptions | PostgresLockStoreOptions | RedisLockStoreOptions | SqlServerLockStoreOptions) => Promise<LockStore>;
export { createLockStore };
