'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Publisher, Subscriber, type }) {
  let exchangeName,
      publisher,
      subscriber;

  setup(() => {
    exchangeName = uuid();
    publisher = new Publisher();
    subscriber = new Subscriber();
  });

  suite('Publisher', () => {
    test('is a function.', async () => {
      assert.that(Publisher).is.ofType('function');
    });

    suite('initialize', () => {
      test('is a function.', async () => {
        assert.that(publisher.initialize).is.ofType('function');
      });

      if (type === 'amqp') {
        test('throws an error if url is missing.', async () => {
          await assert.that(async () => {
            await publisher.initialize({ exchangeName });
          }).is.throwingAsync('Url is missing.');
        });

        test('throws an error if exchange name is missing.', async () => {
          await assert.that(async () => {
            await publisher.initialize({ url: 'amqp://localhost:5672' });
          }).is.throwingAsync('Exchange name is missing.');
        });
      }

      if (type === 'inmemory') {
        /* eslint-disable mocha/no-identical-title */
        test('throws an error if exchange name is missing.', async () => {
          await assert.that(async () => {
            await publisher.initialize({});
          }).is.throwingAsync('Exchange name is missing.');
        });
        /* eslint-enable mocha/no-identical-title */
      }
    });
  });

  suite('Subscriber', () => {
    test('is a function.', async () => {
      assert.that(Subscriber).is.ofType('function');
    });

    suite('initialize', () => {
      test('is a function.', async () => {
        assert.that(subscriber.initialize).is.ofType('function');
      });

      if (type === 'amqp') {
        test('throws an error if url is missing.', async () => {
          await assert.that(async () => {
            await subscriber.initialize({
              exchangeName,
              async onReceiveMessage () {
                // Intentionally left blank.
              }
            });
          }).is.throwingAsync('Url is missing.');
        });

        test('throws an error if exchange name is missing.', async () => {
          await assert.that(async () => {
            await subscriber.initialize({
              url: 'amqp://localhost:5672',
              async onReceiveMessage () {
                // Intentionally left blank.
              }
            });
          }).is.throwingAsync('Exchange name is missing.');
        });

        test('throws an error if on receive message is missing.', async () => {
          await assert.that(async () => {
            await subscriber.initialize({
              url: 'amqp://localhost:5672',
              exchangeName
            });
          }).is.throwingAsync('On receive message is missing.');
        });
      }

      if (type === 'inmemory') {
        /* eslint-disable mocha/no-identical-title */
        test('throws an error if exchange name is missing.', async () => {
          await assert.that(async () => {
            await subscriber.initialize({});
          }).is.throwingAsync('Exchange name is missing.');
        });
        /* eslint-enable mocha/no-identical-title */
      }
    });
  });
};

module.exports = getTestsFor;
