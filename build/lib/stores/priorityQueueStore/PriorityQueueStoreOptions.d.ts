import { InMemoryPriorityQueueStoreOptions } from './InMemory/InMemoryPriorityQueueStoreOptions';
import { MongoDbPriorityQueueStoreOptions } from './MongoDb/MongDbPriorityQueueStoreOptions';
import { MySqlPriorityQueueStoreOptions } from './MySql/MySqlPriorityQueueStoreOptions';
import { PostgresPriorityQueueStoreOptions } from './Postgres/PostgresPriorityQueueStoreOptions';
import { SqlServerPriorityQueueStoreOptions } from './SqlServer/SqlServerPriorityQueueStoreOptions';
export declare type PriorityQueueStoreOptions<TItem, TItemIdentifier> = InMemoryPriorityQueueStoreOptions<TItem, TItemIdentifier> | MongoDbPriorityQueueStoreOptions<TItem, TItemIdentifier> | MySqlPriorityQueueStoreOptions<TItem, TItemIdentifier> | PostgresPriorityQueueStoreOptions<TItem, TItemIdentifier> | SqlServerPriorityQueueStoreOptions<TItem, TItemIdentifier>;
