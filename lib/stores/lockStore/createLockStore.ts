import { errors } from '../../common/errors';
import { InMemoryLockStore, InMemoryLockStoreOptions } from './InMemory';
import { LockStore } from './LockStore';
import { MongoDbLockStore, MongoDbLockStoreOptions } from './MongoDb';
import { MySqlLockStore, MySqlLockStoreOptions } from './MySql';
import { PostgresLockStore, PostgresLockStoreOptions } from './Postgres';
import { RedisLockStore, RedisLockStoreOptions } from './Redis';
import { SqlServerLockStore, SqlServerLockStoreOptions } from './SqlServer';

const createLockStore = async function (
  options: InMemoryLockStoreOptions | MongoDbLockStoreOptions | MySqlLockStoreOptions | PostgresLockStoreOptions | RedisLockStoreOptions | SqlServerLockStoreOptions
): Promise<LockStore> {
  switch (options.type) {
    case 'InMemory': {
      return InMemoryLockStore.create(options);
    }
    case 'MariaDb': {
      return MySqlLockStore.create(options);
    }
    case 'MongoDb': {
      return MongoDbLockStore.create(options);
    }
    case 'MySql': {
      return MySqlLockStore.create(options);
    }
    case 'Postgres': {
      return PostgresLockStore.create(options);
    }
    case 'Redis': {
      return RedisLockStore.create(options);
    }
    case 'SqlServer': {
      return SqlServerLockStore.create(options);
    }
    default: {
      throw new errors.DatabaseTypeInvalid();
    }
  }
};

export { createLockStore };
