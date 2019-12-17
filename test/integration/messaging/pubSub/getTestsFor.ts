import { assert } from 'assertthat';
import { Publisher } from '../../../../lib/messaging/pubSub/Publisher';
import { Subscriber } from '../../../../lib/messaging/pubSub/Subscriber';
import { uuid } from 'uuidv4';

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

    let resolveSubscriber: () => void;
    const subscriberCallbackPromise = new Promise((resolve): void => {
      resolveSubscriber = resolve;
    });

    await subscriber.subscribe({
      channel,
      async callback (receivedMessage): Promise<void> {
        assert.that(receivedMessage).is.equalTo(message);

        resolveSubscriber();
      }
    });

    await publisher.publish({
      channel,
      message
    });

    await subscriberCallbackPromise;
  });

  test('published messages are received by all subscribers.', async (): Promise<void> => {
    const secondSubscriber = await createSubscriber();

    const channel = uuid();
    const message = { data: uuid() };

    let resolveSubscriber: () => void;
    const subscriberCallbackPromise = new Promise((resolve): void => {
      resolveSubscriber = resolve;
    });

    await subscriber.subscribe({
      channel,
      async callback (receivedMessage): Promise<void> {
        assert.that(receivedMessage).is.equalTo(message);

        resolveSubscriber();
      }
    });

    let resolveSecondSubscriber: () => void;
    const secondSubscriberCallbackPromise = new Promise((resolve): void => {
      resolveSecondSubscriber = resolve;
    });

    await secondSubscriber.subscribe({
      channel,
      async callback (receivedMessage): Promise<void> {
        assert.that(receivedMessage).is.equalTo(message);

        resolveSecondSubscriber();
      }
    });

    await publisher.publish({
      channel,
      message
    });

    await Promise.all([ subscriberCallbackPromise, secondSubscriberCallbackPromise ]);
  });

  test('after unsubscribing no more messages are received.', async (): Promise<void> => {
    const channel = uuid();
    const message = { data: uuid() };

    let receivedMessageCount = 0;

    const callback = async (): Promise<void> => {
      receivedMessageCount += 1;
    };

    await subscriber.subscribe({
      channel,
      callback
    });

    await subscriber.unsubscribe({
      channel,
      callback
    });

    await publisher.publish({
      channel,
      message
    });

    await new Promise((resolve): void => {
      setTimeout(resolve, 100);
    });

    assert.that(receivedMessageCount).is.equalTo(0);
  });
};
/* eslint-enable mocha/max-top-level-suites, mocha/no-top-level-hooks */

export { getTestsFor };
