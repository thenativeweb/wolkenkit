'use strict';

const assert = require('assertthat'),
      getOptionTests = require('get-option-tests'),
      uuid = require('uuidv4');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Queuestore, type }) {
  let queuestore;

  setup(() => {
    queuestore = new Queuestore();
  });

  test('is a function.', async () => {
    assert.that(Queuestore).is.ofType('function');
  });

  suite('initialize', () => {
    test('is a function.', async () => {
      assert.that(queuestore.initialize).is.ofType('function');
    });

    if (type !== 'InMemory') {
      getOptionTests({
        options: {
          hostname: 'localhost',
          port: 3000,
          username: 'wolkenkit',
          password: 'wolkenkit',
          database: 'wolkenkit'
        },
        async run (options) {
          await queuestore.initialize(options);
        }
      });
    }
  });

  suite('enqueueItem', () => {
    test('is a function.', async () => {
      assert.that(queuestore.enqueueItem).is.ofType('function');
    });

    getOptionTests({
      options: {
        item: {}
      },
      async run (options) {
        await queuestore.enqueueItem(options);
      }
    });
  });

  suite('getNextUnprocessedItem', () => {
    test('is a function.', async () => {
      assert.that(queuestore.getNextUnprocessedItem).is.ofType('function');
    });
  });

  suite('extendItemProcessingTime', () => {
    test('is a function.', async () => {
      assert.that(queuestore.extendItemProcessingTime).is.ofType('function');
    });

    getOptionTests({
      options: {
        item: {},
        token: uuid()
      },
      async run (options) {
        await queuestore.extendItemProcessingTime(options);
      }
    });
  });

  suite('dequeueItem', () => {
    test('is a function.', async () => {
      assert.that(queuestore.dequeueItem).is.ofType('function');
    });

    getOptionTests({
      options: {
        item: {},
        token: uuid()
      },
      async run (options) {
        await queuestore.dequeueItem(options);
      }
    });
  });

  suite('destroy', () => {
    test('is a function.', async () => {
      assert.that(queuestore.destroy).is.ofType('function');
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
