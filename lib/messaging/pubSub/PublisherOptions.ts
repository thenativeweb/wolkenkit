import { HttpPublisherOptions } from './Http/HttpPublisherOptions';
import { InMemoryPublisherOptions } from './InMemory/InMemoryPublisherOptions';

export type PublisherOptions = InMemoryPublisherOptions | HttpPublisherOptions;
