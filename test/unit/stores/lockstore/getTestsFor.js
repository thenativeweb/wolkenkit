'use strict';

const assert = require('assertthat'),
      getOptionTests = require('get-option-tests'),
      uuid = require('uuidv4');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Lockstore, type }) {
  let lockstore;

  setup(() => {
    lockstore = new Lockstore();
  });

  test('is a function.', async () => {
    assert.that(Lockstore).is.ofType('function');
  });

  suite('initialize', () => {
    test('is a function.', async () => {
      assert.that(lockstore.initialize).is.ofType('function');
    });

    if (type !== 'InMemory') {
      const options = {
        hostname: 'localhost',
        port: 3000,
        password: 'wolkenkit',
        database: 'wolkenkit'
      };

      if (type !== 'Redis') {
        options.username = 'wolkenkit';
      }

      getOptionTests({
        options,
        async run (testOptions) {
          await lockstore.initialize(testOptions);
        }
      });
    }
  });

  suite('acquireLock', () => {
    test('is a function.', async () => {
      assert.that(lockstore.acquireLock).is.ofType('function');
    });

    getOptionTests({
      options: {
        namespace: uuid(),
        value: { foo: 'bar' }
      },
      excludes: [ 'value.*' ],
      async run (options) {
        await lockstore.acquireLock(options);
      }
    });
  });

  suite('isLocked', () => {
    test('is a function.', async () => {
      assert.that(lockstore.isLocked).is.ofType('function');
    });

    getOptionTests({
      options: {
        namespace: uuid(),
        value: { foo: 'bar' }
      },
      excludes: [ 'value.*' ],
      async run (options) {
        await lockstore.isLocked(options);
      }
    });
  });

  suite('renewLock', () => {
    test('is a function.', async () => {
      assert.that(lockstore.renewLock).is.ofType('function');
    });

    getOptionTests({
      options: {
        namespace: uuid(),
        value: { foo: 'bar' },
        expiresAt: Date.now()
      },
      excludes: [ 'value.*' ],
      async run (options) {
        await lockstore.renewLock(options);
      }
    });
  });

  suite('releaseLock', () => {
    test('is a function.', async () => {
      assert.that(lockstore.releaseLock).is.ofType('function');
    });

    getOptionTests({
      options: {
        namespace: uuid(),
        value: { foo: 'bar' }
      },
      excludes: [ 'value.*' ],
      async run (options) {
        await lockstore.releaseLock(options);
      }
    });
  });

  suite('destroy', () => {
    test('is a function.', async () => {
      assert.that(lockstore.destroy).is.ofType('function');
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
