import { EventEmitter } from 'events';
import { inMemoryEventEmitterSingleton } from './inMemoryEventEmitterSingleton';
import { Subscriber } from '../Subscriber';

class InMemorySubscriber<T extends object> implements Subscriber<T> {
  protected eventEmitter: EventEmitter;

  protected constructor ({ eventEmitter }: { eventEmitter: EventEmitter }) {
    this.eventEmitter = eventEmitter;
  }

  public static async create<T extends object> (): Promise<InMemorySubscriber<T>> {
    return new InMemorySubscriber({ eventEmitter: inMemoryEventEmitterSingleton });
  }

  public async subscribe ({
    channel,
    callback
  }: {
    channel: string;
    callback: (message: T) => void | Promise<void>;
  }): Promise<void> {
    this.eventEmitter.on(channel, callback);
  }
}

export default InMemorySubscriber;
