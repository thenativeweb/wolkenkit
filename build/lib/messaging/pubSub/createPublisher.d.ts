import { Publisher } from './Publisher';
import { PublisherOptions } from './PublisherOptions';
declare const createPublisher: <T extends object>(options: PublisherOptions) => Promise<Publisher<T>>;
export { createPublisher };
