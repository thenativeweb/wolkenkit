import { EventEmitter2 } from 'eventemitter2';
import { InMemoryPublisherOptions } from './InMemoryPublisherOptions';
import { Publisher } from '../Publisher';
declare class InMemoryPublisher<T extends object> implements Publisher<T> {
    protected eventEmitter: EventEmitter2;
    protected constructor({ eventEmitter }: {
        eventEmitter: EventEmitter2;
    });
    static create<TMessage extends object>(options: InMemoryPublisherOptions): Promise<InMemoryPublisher<TMessage>>;
    publish({ channel, message }: {
        channel: string;
        message: T;
    }): Promise<void>;
}
export { InMemoryPublisher };
