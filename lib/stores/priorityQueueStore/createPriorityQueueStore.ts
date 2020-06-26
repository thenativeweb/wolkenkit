import { DoesIdentifierMatchItem } from './DoesIdentifierMatchItem';
import { errors } from '../../common/errors';
import { InMemoryPriorityQueueStore } from './InMemory';
import { MongoDbPriorityQueueStore } from './MongoDb';
import { MySqlPriorityQueueStore } from './MySql';
import { PostgresPriorityQueueStore } from './Postgres';
import { PriorityQueueStore } from './PriorityQueueStore';

const createPriorityQueueStore = async function<TItem, TItemIdentifier> ({ type, doesIdentifierMatchItem, options }: {
  type: string;
  doesIdentifierMatchItem: DoesIdentifierMatchItem<TItem, TItemIdentifier>;
  options: any;
}): Promise<PriorityQueueStore<TItem, TItemIdentifier>> {
  switch (type) {
    case 'InMemory': {
      return await InMemoryPriorityQueueStore.create<TItem, TItemIdentifier>({ doesIdentifierMatchItem, options });
    }
    case 'MariaDb': {
      return await MySqlPriorityQueueStore.create<TItem, TItemIdentifier>({ doesIdentifierMatchItem, options });
    }
    case 'MongoDb': {
      return await MongoDbPriorityQueueStore.create<TItem, TItemIdentifier>({ doesIdentifierMatchItem, options });
    }
    case 'MySql': {
      return await MySqlPriorityQueueStore.create<TItem, TItemIdentifier>({ doesIdentifierMatchItem, options });
    }
    case 'Postgres': {
      return await PostgresPriorityQueueStore.create<TItem, TItemIdentifier>({ doesIdentifierMatchItem, options });
    }
    default: {
      throw new errors.DatabaseTypeInvalid();
    }
  }
};

export { createPriorityQueueStore };
