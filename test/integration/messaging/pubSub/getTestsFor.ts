import { assert } from 'assertthat';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';
import { v4 } from 'uuid';
import { waitForSignals } from 'wait-for-signals';

/* eslint-disable mocha/max-top-level-suites, mocha/no-top-level-hooks */
const getTestsFor = function ({ createPublisher, createSubscriber }: {
  createPublisher: <T extends object> () => Promise<Publisher<T>>;
  createSubscriber: <T extends object> () => Promise<Subscriber<T>>;
}): void {
  let publisher: Publisher<{ data: any }>,
      subscriber: Subscriber<{ data: any }>;

  setup(async (): Promise<void> => {
    publisher = await createPublisher();
    subscriber = await createSubscriber();
  });

  test('published messages are received by the subscriber.', async (): Promise<void> => {
    const channel = v4();
    const message = { data: v4() };

    const counter = waitForSignals({ count: 1 });

    await subscriber.subscribe({
      channel,
      async callback (receivedMessage): Promise<void> {
        assert.that(receivedMessage).is.equalTo(message);

        await counter.signal();
      }
    });

    await publisher.publish({ channel, message });

    await counter.promise;
  });

  test('published messages are received by all subscribers.', async (): Promise<void> => {
    const secondSubscriber = await createSubscriber();

    const channel = v4();
    const message = { data: v4() };

    const counterOne = waitForSignals({ count: 1 });

    await subscriber.subscribe({
      channel,
      async callback (receivedMessage): Promise<void> {
        assert.that(receivedMessage).is.equalTo(message);

        await counterOne.signal();
      }
    });

    const counterTwo = waitForSignals({ count: 1 });

    await secondSubscriber.subscribe({
      channel,
      async callback (receivedMessage): Promise<void> {
        assert.that(receivedMessage).is.equalTo(message);

        await counterTwo.signal();
      }
    });

    await publisher.publish({ channel, message });

    await Promise.all([ counterOne.promise, counterTwo.promise ]);
  });

  test('after unsubscribing no more messages are received.', async (): Promise<void> => {
    const channel = v4();
    const message = { data: v4() };

    let receivedMessageCount = 0;

    const callback = async (): Promise<void> => {
      receivedMessageCount += 1;
    };

    await subscriber.subscribe({ channel, callback });
    await subscriber.unsubscribe({ channel, callback });
    await publisher.publish({ channel, message });

    await new Promise<void>((resolve): void => {
      setTimeout(resolve, 100);
    });

    assert.that(receivedMessageCount).is.equalTo(0);
  });

  test('can subscribe to all channels simultaneously.', async (): Promise<void> => {
    const messageOne = { data: v4() };
    const messageTwo = { data: v4() };
    const receivedMessages: object[] = [];

    const counter = waitForSignals({ count: 2 });

    await subscriber.subscribe({
      channel: '*',
      async callback (receivedMessage): Promise<void> {
        receivedMessages.push(receivedMessage);

        await counter.signal();
      }
    });

    await publisher.publish({ channel: v4(), message: messageOne });
    await publisher.publish({ channel: v4(), message: messageTwo });

    await counter.promise;

    assert.that(receivedMessages).is.equalTo([
      messageOne,
      messageTwo
    ]);
  });
};
/* eslint-enable mocha/max-top-level-suites, mocha/no-top-level-hooks */

// eslint-disable-next-line mocha/no-exports
export { getTestsFor };
