import { errors } from '../../common/errors';
import { InMemoryLockStore } from './InMemory';
import { LockStore } from './LockStore';
import { MariaDbLockStore } from './MariaDb';
import { MongoDbLockStore } from './MongoDb';
import { MySqlLockStore } from './MySql';
import { PostgresLockStore } from './Postgres';
import { RedisLockStore } from './Redis';
import { SqlServerLockStore } from './SqlServer';

const createLockStore = async function ({ type, options }: {
  type: string;
  options: any;
}): Promise<LockStore> {
  switch (type) {
    case 'InMemory': {
      return InMemoryLockStore.create({});
    }
    case 'MariaDb': {
      return MariaDbLockStore.create(options);
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
