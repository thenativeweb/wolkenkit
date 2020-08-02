import { ConsumerProgressStore } from './ConsumerProgressStore';
import { ConsumerProgressStoreOptions } from './ConsumerProgressStoreOptions';
import { errors } from '../../common/errors';
import { InMemoryConsumerProgressStore } from './InMemory';
import { MongoDbConsumerProgressStore } from './MongoDb';
import { MySqlConsumerProgressStore } from './MySql';
import { PostgresConsumerProgressStore } from './Postgres';
import { SqlServerConsumerProgressStore } from './SqlServer';

const createConsumerProgressStore = async function (
  options: ConsumerProgressStoreOptions
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
