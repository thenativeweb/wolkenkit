import { assert } from 'assertthat';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';
import { uuid } from 'uuidv4';
import { waitForSignals } from 'wait-for-signals';

/* eslint-disable mocha/max-top-level-suites, mocha/no-top-level-hooks */
const getTestsFor = function ({ createPublisher, createSubscriber }: {
  createPublisher<T extends object> (): Promise<Publisher<T>>;
  createSubscriber<T extends object> (): Promise<Subscriber<T>>;
}): void {
  let publisher: Publisher<{ data: any }>,
      subscriber: Subscriber<{ data: any }>;

  setup(async (): Promise<void> => {
    publisher = await createPublisher();
    subscriber = await createSubscriber();
  });

  test('published messages are received by the subscriber.', async (): Promise<void> => {
    const channel = uuid();
    const message = { data: uuid() };

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

    const channel = uuid();
    const message = { data: uuid() };

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
    const channel = uuid();
    const message = { data: uuid() };

    let receivedMessageCount = 0;

    const callback = async (): Promise<void> => {
      receivedMessageCount += 1;
    };

    await subscriber.subscribe({ channel, callback });
    await subscriber.unsubscribe({ channel, callback });
    await publisher.publish({ channel, message });

    await new Promise((resolve): void => {
      setTimeout(resolve, 100);
    });

    assert.that(receivedMessageCount).is.equalTo(0);
  });

  test('can subscribe to all channels simultaneously.', async (): Promise<void> => {
    const messageOne = { data: uuid() };
    const messageTwo = { data: uuid() };
    const receivedMessages: object[] = [];

    const counter = waitForSignals({ count: 2 });

    await subscriber.subscribe({
      channel: '*',
      async callback (receivedMessage): Promise<void> {
        receivedMessages.push(receivedMessage);

        await counter.signal();
      }
    });

    await publisher.publish({ channel: uuid(), message: messageOne });
    await publisher.publish({ channel: uuid(), message: messageTwo });

    await counter.promise;

    assert.that(receivedMessages).is.equalTo([
      messageOne,
      messageTwo
    ]);
  });
};
/* eslint-enable mocha/max-top-level-suites, mocha/no-top-level-hooks */

export { getTestsFor };
