import { HttpSubscriberOptions } from './Http/HttpSubscriberOptions';
import { InMemorySubscriberOptions } from './InMemory/InMemorySubscriberOptions';

export type SubscriberOptions = InMemorySubscriberOptions | HttpSubscriberOptions;
