import { RootOptions } from '../../../RootOptions';
export interface PriorityQueueMongoDbOptions extends RootOptions {
    'connection-string': string;
    'collection-name-queues': string;
}
