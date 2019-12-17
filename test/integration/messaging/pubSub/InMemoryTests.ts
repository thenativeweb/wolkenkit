import { getTestsFor } from './getTestsFor';
import { InMemoryPublisher } from '../../../../lib/messaging/pubSub/InMemory/InMemoryPublisher';
import { InMemorySubscriber } from '../../../../lib/messaging/pubSub/InMemory/InMemorySubscriber';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';

suite('InMemory', (): void => {
  getTestsFor({
    async createPublisher<T extends object> (): Promise<Publisher<T>> {
      return await InMemoryPublisher.create();
    },
    async createSubscriber<T extends object> (): Promise<Subscriber<T>> {
      return await InMemorySubscriber.create();
    }
  });
});
