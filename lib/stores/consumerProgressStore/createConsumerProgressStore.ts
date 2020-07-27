import { ConsumerProgressStore } from './ConsumerProgressStore';
import { errors } from '../../common/errors';
import { InMemoryConsumerProgressStore, InMemoryConsumerProgressStoreOptions } from './InMemory';
import { MongoDbConsumerProgressStore, MongoDbConsumerProgressStoreOptions } from './MongoDb';
import { MySqlConsumerProgressStore, MySqlConsumerProgressStoreOptions } from './MySql';
import { PostgresConsumerProgressStore, PostgresConsumerProgressStoreOptions } from './Postgres';
import { SqlServerConsumerProgressStore, SqlServerConsumerProgressStoreOptions } from './SqlServer';

const createConsumerProgressStore = async function (
  options: InMemoryConsumerProgressStoreOptions | MongoDbConsumerProgressStoreOptions | MySqlConsumerProgressStoreOptions | PostgresConsumerProgressStoreOptions | SqlServerConsumerProgressStoreOptions
): Promise<ConsumerProgressStore> {
  switch (options.type) {
    case 'InMemory': {
      return InMemoryConsumerProgressStore.create(options);
    }
    case 'MariaDb': {
      return MySqlConsumerProgressStore.create(options);
    }
    case 'MongoDb': {
      return MongoDbConsumerProgressStore.create(options);
    }
    case 'MySql': {
      return MySqlConsumerProgressStore.create(options);
    }
    case 'Postgres': {
      return PostgresConsumerProgressStore.create(options);
    }
    case 'SqlServer': {
      return SqlServerConsumerProgressStore.create(options);
    }
    default: {
      throw new errors.DatabaseTypeInvalid();
    }
  }
};

export { createConsumerProgressStore };
