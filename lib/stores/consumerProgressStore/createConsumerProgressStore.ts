import { ConsumerProgressStore } from './ConsumerProgressStore';
import { errors } from '../../common/errors';
import { InMemoryConsumerProgressStore } from './InMemory';
import { MongoDbConsumerProgressStore } from './MongoDb';
import { MySqlConsumerProgressStore } from './MySql';
import { PostgresConsumerProgressStore } from './Postgres';
import { SqlServerConsumerProgressStore } from './SqlServer';

const createConsumerProgressStore = async function ({ type, options }: {
  type: string;
  options: any;
}): Promise<ConsumerProgressStore> {
  switch (type) {
    case 'InMemory': {
      return InMemoryConsumerProgressStore.create();
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
