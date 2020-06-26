import { EventEmitter2 } from 'eventemitter2';
import { inMemoryEventEmitter } from './inMemoryEventEmitter';
import { Subscriber } from '../Subscriber';

class InMemorySubscriber<T extends object> implements Subscriber<T> {
  protected eventEmitter: EventEmitter2;

  protected constructor ({ eventEmitter }: { eventEmitter: EventEmitter2 }) {
    this.eventEmitter = eventEmitter;
  }

  public static async create<T extends object> (): Promise<InMemorySubscriber<T>> {
    return new InMemorySubscriber({ eventEmitter: inMemoryEventEmitter });
  }

  public async subscribe ({ channel, callback }: {
    channel: string;
    callback: (message: T) => void | Promise<void>;
  }): Promise<void> {
    this.eventEmitter.on(channel, callback);
  }

  public async unsubscribe ({ channel, callback }: {
    channel: string;
    callback: (message: T) => void | Promise<void>;
  }): Promise<void> {
    this.eventEmitter.off(channel, callback);
  }
}

export { InMemorySubscriber };
