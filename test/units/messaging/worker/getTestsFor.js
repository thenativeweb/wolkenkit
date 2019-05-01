'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Dispatcher, Worker, type }) {
  let dispatcher,
      exchangeName,
      worker;

  setup(() => {
    exchangeName = uuid();
    dispatcher = new Dispatcher();
    worker = new Worker();
  });

  suite('Dispatcher', () => {
    test('is a function.', async () => {
      assert.that(Dispatcher).is.ofType('function');
    });

    suite('initialize', () => {
      test('is a function.', async () => {
        assert.that(dispatcher.initialize).is.ofType('function');
      });

      if (type === 'amqp') {
        test('throws an error if url is missing.', async () => {
          await assert.that(async () => {
            await dispatcher.initialize({ exchangeName });
          }).is.throwingAsync('Url is missing.');
        });

        test('throws an error if exchange name is missing.', async () => {
          await assert.that(async () => {
            await dispatcher.initialize({ url: 'amqp://localhost:5672' });
          }).is.throwingAsync('Exchange name is missing.');
        });
      }

      if (type === 'inmemory') {
        /* eslint-disable mocha/no-identical-title */
        test('throws an error if exchange name is missing.', async () => {
          await assert.that(async () => {
            await dispatcher.initialize({});
          }).is.throwingAsync('Exchange name is missing.');
        });
        /* eslint-enable mocha/no-identical-title */
      }
    });
  });

  suite('Worker', () => {
    test('is a function.', async () => {
      assert.that(Worker).is.ofType('function');
    });

    suite('initialize', () => {
      test('is a function.', async () => {
        assert.that(worker.initialize).is.ofType('function');
      });

      if (type === 'amqp') {
        test('throws an error if url is missing.', async () => {
          await assert.that(async () => {
            await worker.initialize({
              exchangeName,
              async onReceiveMessage () {
                // Intentionally left blank.
              }
            });
          }).is.throwingAsync('Url is missing.');
        });

        test('throws an error if exchange name is missing.', async () => {
          await assert.that(async () => {
            await worker.initialize({
              url: 'amqp://localhost:5672',
              async onReceiveMessage () {
                // Intentionally left blank.
              }
            });
          }).is.throwingAsync('Exchange name is missing.');
        });

        test('throws an error if on receive message is missing.', async () => {
          await assert.that(async () => {
            await worker.initialize({
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
            await worker.initialize({});
          }).is.throwingAsync('Exchange name is missing.');
        });
        /* eslint-enable mocha/no-identical-title */
      }
    });
  });
};

module.exports = getTestsFor;
