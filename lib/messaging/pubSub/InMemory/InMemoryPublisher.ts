import { InMemoryPubSubSingleton } from './InMemoryPubSubSingleton';
import { Publisher } from '../Publisher';

class InMemoryPublisher<T extends object> implements Publisher<T> {
  protected pubSubSingleton: InMemoryPubSubSingleton;

  protected constructor ({ pubSubSingleton }: { pubSubSingleton: InMemoryPubSubSingleton }) {
    this.pubSubSingleton = pubSubSingleton;
  }

  public static async create<T extends object> (): Promise<InMemoryPublisher<T>> {
    const pubSubSingleton = await InMemoryPubSubSingleton.create();

    return new InMemoryPublisher({ pubSubSingleton });
  }

  public async publish ({
    channel,
    message
  }: {
    channel: string;
    message: T;
  }): Promise<void> {
    this.pubSubSingleton.eventEmitter.emit(channel, message);
  }
}

export default InMemoryPublisher;
