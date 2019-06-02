'use strict';

const assert = require('assertthat'),
      getOptionTests = require('get-option-tests');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Dispatcher }) {
  if (!Dispatcher) {
    throw new Error('Dispatcher is missing.');
  }

  let dispatcher;

  setup(() => {
    dispatcher = new Dispatcher();
  });

  suite('initialize', () => {
    test('is a function.', async () => {
      assert.that(dispatcher.initialize).is.ofType('function');
    });

    getOptionTests({
      options: {
        concurrency: 256,
        async onDispatch () {
          // ...
        }
      },
      async run (options) {
        await dispatcher.initialize(options);
      }
    });
  });

  suite('schedule', () => {
    test('is a function.', async () => {
      assert.that(dispatcher.schedule).is.ofType('function');
    });

    getOptionTests({
      options: {
        command: {}
      },
      async run (options) {
        await dispatcher.schedule(options);
      }
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
