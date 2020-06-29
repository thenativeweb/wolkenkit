import { ConsumerProgressStore } from './ConsumerProgressStore';
import { errors } from '../../common/errors';
import { InMemoryConsumerProgressStore } from './InMemory';
import { MongoDbConsumerProgressStore } from './MongoDb';

const createConsumerProgressStore = async function ({ type, options }: {
  type: string;
  options: any;
}): Promise<ConsumerProgressStore> {
  switch (type) {
    case 'InMemory': {
      return InMemoryConsumerProgressStore.create();
    }
    case 'MongoDb': {
      return MongoDbConsumerProgressStore.create(options);
    }
    default: {
      throw new errors.DatabaseTypeInvalid();
    }
  }
};

export { createConsumerProgressStore };
