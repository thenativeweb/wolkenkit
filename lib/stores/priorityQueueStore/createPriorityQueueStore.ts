import { errors } from '../../common/errors';
import { InMemoryPriorityQueueStore } from './InMemory';
import { InMemoryPriorityQueueStoreOptions } from './InMemory/InMemoryPriorityQueueStoreOptions';
import { MongoDbPriorityQueueStore } from './MongoDb';
import { MongoDbPriorityQueueStoreOptions } from './MongoDb/MongDbPriorityQueueStoreOptions';
import { MySqlPriorityQueueStore } from './MySql';
import { MySqlPriorityQueueStoreOptions } from './MySql/MySqlPriorityQueueStoreOptions';
import { PostgresPriorityQueueStore } from './Postgres';
import { PostgresPriorityQueueStoreOptions } from './Postgres/PostgresPriorityQueueStoreOptions';
import { PriorityQueueStore } from './PriorityQueueStore';
import { SqlServerPriorityQueueStoreOptions } from './SqlServer/SqlServerPriorityQueueStoreOptions';

const createPriorityQueueStore = async function<TItem, TItemIdentifier> (
  options: InMemoryPriorityQueueStoreOptions<TItem, TItemIdentifier> | MongoDbPriorityQueueStoreOptions<TItem, TItemIdentifier> | MySqlPriorityQueueStoreOptions<TItem, TItemIdentifier> | PostgresPriorityQueueStoreOptions<TItem, TItemIdentifier> | SqlServerPriorityQueueStoreOptions<TItem, TItemIdentifier>
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
