import { errors } from '../../shared/errors';
import { InMemoryPriorityQueueStore } from './InMemory';
import { MySqlPriorityQueueStore } from './MySql';
import { PostgresPriorityQueueStore } from './Postgres';
import { PriorityQueueStore } from './PriorityQueueStore';

const createPriorityQueueStore = async function<TItem> ({ type, options }: {
  type: string;
  options: any;
}): Promise<PriorityQueueStore<TItem>> {
  switch (type) {
    case 'InMemory': {
      return await InMemoryPriorityQueueStore.create(options);
    }
    case 'MariaDb': {
      return await MySqlPriorityQueueStore.create(options);
    }
    case 'MySql': {
      return await MySqlPriorityQueueStore.create(options);
    }
    case 'Postgres': {
      return await PostgresPriorityQueueStore.create(options);
    }
    default: {
      throw new errors.DatabaseTypeInvalid();
    }
  }
};

export { createPriorityQueueStore };
