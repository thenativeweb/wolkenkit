'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Dispatcher, Worker, getOptions }) {
  let dispatcher,
      exchangeName,
      worker;

  setup(() => {
    exchangeName = uuid();
    dispatcher = new Dispatcher();
    worker = new Worker();
  });

  suite('Dispatcher', () => {
    suite('initialize', () => {
      test('does not throw an error if the dispatcher is reachable.', async () => {
        await assert.that(async () => {
          await dispatcher.initialize({ ...getOptions(), exchangeName });
        }).is.not.throwing();
      });
    });
  });

  suite('Worker', () => {
    suite('initialize', () => {
      test('does not throw an error if the dispatcher is reachable.', async () => {
        const onReceiveMessage = async function () {
          // Intentionally left blank.
        };

        await assert.that(async () => {
          await worker.initialize({ ...getOptions(), exchangeName, onReceiveMessage });
        }).is.not.throwing();
      });
    });
  });

  suite('worker', () => {
    test('dispatches messages to a single worker.', async () => {
      const receivedMessages = [];

      const onReceiveMessage = async function ({ message }) {
        receivedMessages.push(message);
      };

      await dispatcher.initialize({ ...getOptions(), exchangeName });
      await worker.initialize({ ...getOptions(), exchangeName, onReceiveMessage });

      const message = { foo: 'bar' };

      await dispatcher.dispatchMessage({ message });

      await new Promise(resolve => setTimeout(resolve, 250));

      assert.that(receivedMessages.length).is.equalTo(1);
      assert.that(receivedMessages[0]).is.equalTo(message);
    });

    test('dispatches messages to multiple workers using load-balancing.', async () => {
      const worker2 = new Worker();

      const receivedMessages1 = [],
            receivedMessages2 = [];

      const onReceiveMessage1 = async function ({ message }) {
        receivedMessages1.push(message);
      };
      const onReceiveMessage2 = async function ({ message }) {
        receivedMessages2.push(message);
      };

      await dispatcher.initialize({ ...getOptions(), exchangeName });
      await worker.initialize({ ...getOptions(), exchangeName, onReceiveMessage: onReceiveMessage1 });
      await worker2.initialize({ ...getOptions(), exchangeName, onReceiveMessage: onReceiveMessage2 });

      const message1 = { foo: 'bar' },
            message2 = { foo: 'baz' };

      await dispatcher.dispatchMessage({ message: message1 });
      await dispatcher.dispatchMessage({ message: message2 });

      await new Promise(resolve => setTimeout(resolve, 50));

      assert.that(receivedMessages1.length).is.equalTo(1);
      assert.that(receivedMessages1[0]).is.equalTo(message1);
      assert.that(receivedMessages2.length).is.equalTo(1);
      assert.that(receivedMessages2[0]).is.equalTo(message2);
    });
  });
};

module.exports = getTestsFor;
