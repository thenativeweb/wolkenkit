import { EventEmitter2 } from 'eventemitter2';
import { InMemorySubscriberOptions } from './InMemorySubscriberOptions';
import { Subscriber } from '../Subscriber';
declare class InMemorySubscriber<T extends object> implements Subscriber<T> {
    protected eventEmitter: EventEmitter2;
    protected constructor({ eventEmitter }: {
        eventEmitter: EventEmitter2;
    });
    static create<TCreate extends object>(options: InMemorySubscriberOptions): Promise<InMemorySubscriber<TCreate>>;
    subscribe({ channel, callback }: {
        channel: string;
        callback: (message: T) => void | Promise<void>;
    }): Promise<void>;
    unsubscribe({ channel, callback }: {
        channel: string;
        callback: (message: T) => void | Promise<void>;
    }): Promise<void>;
}
export { InMemorySubscriber };
