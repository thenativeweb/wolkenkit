import { EventEmitter2 } from 'eventemitter2';
import { inMemoryEventEmitter } from './inMemoryEventEmitter';
import { Publisher } from '../Publisher';

class InMemoryPublisher<T extends object> implements Publisher<T> {
  protected eventEmitter: EventEmitter2;

  protected constructor ({ eventEmitter }: { eventEmitter: EventEmitter2 }) {
    this.eventEmitter = eventEmitter;
  }

  public static async create<T extends object> (): Promise<InMemoryPublisher<T>> {
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
