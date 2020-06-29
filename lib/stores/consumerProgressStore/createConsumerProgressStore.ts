import { ConsumerProgressStore } from './ConsumerProgressStore';
import { errors } from '../../common/errors';
import { InMemoryConsumerProgressStore } from './InMemory';
import { MongoDbConsumerProgressStore } from './MongoDb';
import { MySqlConsumerProgressStore } from './MySql';

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
    default: {
      throw new errors.DatabaseTypeInvalid();
    }
  }
};

export { createConsumerProgressStore };
