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
        test('throws an error if hostname is missing.', async () => {
          await assert.that(async () => {
            await publisher.initialize({
              port: 5672,
              username: 'wolkenkit',
              password: 'wolkenkit',
              exchangeName
            });
          }).is.throwingAsync('Hostname is missing.');
        });

        test('throws an error if port is missing.', async () => {
          await assert.that(async () => {
            await publisher.initialize({
              hostname: 'localhost',
              username: 'wolkenkit',
              password: 'wolkenkit',
              exchangeName
            });
          }).is.throwingAsync('Port is missing.');
        });

        test('throws an error if username is missing.', async () => {
          await assert.that(async () => {
            await publisher.initialize({
              hostname: 'localhost',
              port: 5672,
              password: 'wolkenkit',
              exchangeName
            });
          }).is.throwingAsync('Username is missing.');
        });

        test('throws an error if password is missing.', async () => {
          await assert.that(async () => {
            await publisher.initialize({
              hostname: 'localhost',
              port: 5672,
              username: 'wolkenkit',
              exchangeName
            });
          }).is.throwingAsync('Password is missing.');
        });

        test('throws an error if exchange name is missing.', async () => {
          await assert.that(async () => {
            await publisher.initialize({
              hostname: 'localhost',
              port: 5672,
              username: 'wolkenkit',
              password: 'wolkenkit'
            });
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
        test('throws an error if hostname is missing.', async () => {
          await assert.that(async () => {
            await subscriber.initialize({
              port: 5672,
              username: 'wolkenkit',
              password: 'wolkenkit',
              exchangeName,
              async onReceiveMessage () {
                // Intentionally left blank.
              }
            });
          }).is.throwingAsync('Hostname is missing.');
        });

        test('throws an error if port is missing.', async () => {
          await assert.that(async () => {
            await subscriber.initialize({
              hostname: 'localhost',
              username: 'wolkenkit',
              password: 'wolkenkit',
              exchangeName,
              async onReceiveMessage () {
                // Intentionally left blank.
              }
            });
          }).is.throwingAsync('Port is missing.');
        });

        test('throws an error if username is missing.', async () => {
          await assert.that(async () => {
            await subscriber.initialize({
              hostname: 'localhost',
              port: 5672,
              password: 'wolkenkit',
              exchangeName,
              async onReceiveMessage () {
                // Intentionally left blank.
              }
            });
          }).is.throwingAsync('Username is missing.');
        });

        test('throws an error if password is missing.', async () => {
          await assert.that(async () => {
            await subscriber.initialize({
              hostname: 'localhost',
              port: 5672,
              username: 'wolkenkit',
              exchangeName,
              async onReceiveMessage () {
                // Intentionally left blank.
              }
            });
          }).is.throwingAsync('Password is missing.');
        });

        test('throws an error if exchange name is missing.', async () => {
          await assert.that(async () => {
            await subscriber.initialize({
              hostname: 'localhost',
              port: 5672,
              username: 'wolkenkit',
              password: 'wolkenkit',
              async onReceiveMessage () {
                // Intentionally left blank.
              }
            });
          }).is.throwingAsync('Exchange name is missing.');
        });

        test('throws an error if on receive message is missing.', async () => {
          await assert.that(async () => {
            await subscriber.initialize({
              hostname: 'localhost',
              port: 5672,
              username: 'wolkenkit',
              password: 'wolkenkit',
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
