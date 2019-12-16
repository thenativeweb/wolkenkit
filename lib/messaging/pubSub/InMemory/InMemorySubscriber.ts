import { InMemoryPubSubSingleton } from './InMemoryPubSubSingleton';
import { Subscriber } from '../Subscriber';

class InMemorySubscriber<T extends object> implements Subscriber<T> {
  protected pubSubSingleton: InMemoryPubSubSingleton;

  protected constructor ({ pubSubSingleton }: { pubSubSingleton: InMemoryPubSubSingleton }) {
    this.pubSubSingleton = pubSubSingleton;
  }

  public static async create<T extends object> (): Promise<InMemorySubscriber<T>> {
    const pubSubSingleton = await InMemoryPubSubSingleton.create();

    return new InMemorySubscriber({ pubSubSingleton });
  }

  public async subscribe ({
    channel,
    callback
  }: {
    channel: string;
    callback: (message: T) => void | Promise<void>;
  }): Promise<void> {
    this.pubSubSingleton.eventEmitter.on(channel, callback);
  }
}

export default InMemorySubscriber;
