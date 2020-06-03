import { errors } from '../../common/errors';
import { InMemoryPriorityQueueStore } from './InMemory';
import { MySqlPriorityQueueStore } from './MySql';
import { PriorityQueueStore } from './PriorityQueueStore';

const createPriorityQueueStore = async function<TItem> ({ type, options }: {
  type: string;
  options: any;
}): Promise<PriorityQueueStore<TItem>> {
  switch (type) {
    case 'InMemory': {
      return await InMemoryPriorityQueueStore.create(options);
    }
    case 'MySql': {
      return await MySqlPriorityQueueStore.create(options);
    }
    default: {
      throw new errors.DatabaseTypeInvalid();
    }
  }
};

export { createPriorityQueueStore };
