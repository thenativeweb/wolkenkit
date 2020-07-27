import { errors } from '../../common/errors';
import { InMemoryPriorityQueueStore } from './InMemory';
import { MongoDbPriorityQueueStore } from './MongoDb';
import { MySqlPriorityQueueStore } from './MySql';
import { PostgresPriorityQueueStore } from './Postgres';
import { PriorityQueueStore } from './PriorityQueueStore';
import { PriorityQueueStoreOptions } from './PriorityQueueStoreOptions';

const createPriorityQueueStore = async function<TItem, TItemIdentifier> (
  options: PriorityQueueStoreOptions<TItem, TItemIdentifier>
): Promise<PriorityQueueStore<TItem, TItemIdentifier>> {
  switch (options.type) {
    case 'InMemory': {
      return await InMemoryPriorityQueueStore.create<TItem, TItemIdentifier>(options);
    }
    case 'MariaDb': {
      return await MySqlPriorityQueueStore.create<TItem, TItemIdentifier>(options);
    }
    case 'MongoDb': {
      return await MongoDbPriorityQueueStore.create<TItem, TItemIdentifier>(options);
    }
    case 'MySql': {
      return await MySqlPriorityQueueStore.create<TItem, TItemIdentifier>(options);
    }
    case 'Postgres': {
      return await PostgresPriorityQueueStore.create<TItem, TItemIdentifier>(options);
    }
    default: {
      throw new errors.DatabaseTypeInvalid();
    }
  }
};

export { createPriorityQueueStore };
