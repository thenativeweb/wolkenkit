import { EventEmitter2 } from 'eventemitter2';
import { inMemoryEventEmitter } from './inMemoryEventEmitter';
import { InMemoryPublisherOptions } from './InMemoryPublisherOptions';
import { Publisher } from '../Publisher';

class InMemoryPublisher<T extends object> implements Publisher<T> {
  protected eventEmitter: EventEmitter2;

  protected constructor ({ eventEmitter }: { eventEmitter: EventEmitter2 }) {
    this.eventEmitter = eventEmitter;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public static async create<TMessage extends object> (options: InMemoryPublisherOptions): Promise<InMemoryPublisher<TMessage>> {
    return new InMemoryPublisher({ eventEmitter: inMemoryEventEmitter });
  }

  public async publish ({ channel, message }: {
    channel: string;
    message: T;
  }): Promise<void> {
    this.eventEmitter.emit(channel, message);
  }
}

export { InMemoryPublisher };
