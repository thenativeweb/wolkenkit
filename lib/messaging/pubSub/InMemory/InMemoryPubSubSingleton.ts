import { EventEmitter } from 'events';

class InMemoryPubSubSingleton {
  protected static instance: undefined | InMemoryPubSubSingleton = undefined;

  public readonly eventEmitter: EventEmitter;

  protected constructor ({ eventEmitter }: { eventEmitter: EventEmitter }) {
    this.eventEmitter = eventEmitter;
  }

  public static async create (): Promise<InMemoryPubSubSingleton> {
    if (this.instance) {
      return this.instance;
    }

    this.instance = new InMemoryPubSubSingleton({
      eventEmitter: new EventEmitter()
    });

    return this.instance;
  }
}

export {
  InMemoryPubSubSingleton
};
