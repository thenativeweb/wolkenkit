'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Publisher, Subscriber, url }) {
  let exchangeName,
      publisher,
      subscriber;

  setup(() => {
    exchangeName = uuid();
    publisher = new Publisher();
    subscriber = new Subscriber();
  });

  suite('Publisher', () => {
    suite('initialize', () => {
      test('does not throw an error if the publisher is reachable.', async () => {
        await assert.that(async () => {
          await publisher.initialize({ url, exchangeName });
        }).is.not.throwing();
      });
    });
  });

  suite('Subscriber', () => {
    suite('initialize', () => {
      test('does not throw an error if the publisher is reachable.', async () => {
        const onReceiveMessage = async function () {
          // Intentionally left blank.
        };

        await assert.that(async () => {
          await subscriber.initialize({ url, exchangeName, onReceiveMessage });
        }).is.not.throwing();
      });
    });
  });

  suite('broadcast', () => {
    test('publishes messages to a single subscriber.', async () => {
      const receivedMessages = [];

      const onReceiveMessage = async function ({ message }) {
        receivedMessages.push(message);
      };

      await publisher.initialize({ url, exchangeName });
      await subscriber.initialize({ url, exchangeName, onReceiveMessage });

      const message = { foo: 'bar' };

      publisher.publishMessage({ message });

      await new Promise(resolve => setTimeout(resolve, 250));

      assert.that(receivedMessages.length).is.equalTo(1);
      assert.that(receivedMessages[0]).is.equalTo(message);
    });

    test('publishes messages to multiple subscribers.', async () => {
      const subscriber2 = new Subscriber();

      const receivedMessages1 = [],
            receivedMessages2 = [];

      const onReceiveMessage1 = async function ({ message }) {
        receivedMessages1.push(message);
      };
      const onReceiveMessage2 = async function ({ message }) {
        receivedMessages2.push(message);
      };

      await publisher.initialize({ url, exchangeName });
      await subscriber.initialize({ url, exchangeName, onReceiveMessage: onReceiveMessage1 });
      await subscriber2.initialize({ url, exchangeName, onReceiveMessage: onReceiveMessage2 });

      const message = { foo: 'bar' };

      publisher.publishMessage({ message });

      await new Promise(resolve => setTimeout(resolve, 50));

      assert.that(receivedMessages1.length).is.equalTo(1);
      assert.that(receivedMessages1[0]).is.equalTo(message);
      assert.that(receivedMessages2.length).is.equalTo(1);
      assert.that(receivedMessages2[0]).is.equalTo(message);
    });
  });
};

module.exports = getTestsFor;
