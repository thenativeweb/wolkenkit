'use strict';

const assert = require('assertthat'),
      getOptionTests = require('get-option-tests'),
      uuid = require('uuidv4');

const { CommandInternal } = require('../../../../common/elements');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Commandstore, type }) {
  let commandstore;

  setup(() => {
    commandstore = new Commandstore();
  });

  test('is a function.', async () => {
    assert.that(Commandstore).is.ofType('function');
  });

  suite('initialize', () => {
    test('is a function.', async () => {
      assert.that(commandstore.initialize).is.ofType('function');
    });

    switch (type) {
      case 'InMemory':
        getOptionTests({
          options: {
            expirationDuration: 1000
          },
          async run (options) {
            await commandstore.initialize(options);
          }
        });
        break;
      default:
        getOptionTests({
          options: {
            expirationDuration: 1000,
            hostname: 'localhost',
            port: 3000,
            username: 'wolkenkit',
            password: 'wolkenkit',
            database: 'wolkenkit'
          },
          async run (options) {
            await commandstore.initialize(options);
          }
        });
    }
  });

  suite('saveCommand', () => {
    test('is a function.', async () => {
      assert.that(commandstore.saveCommand).is.ofType('function');
    });

    getOptionTests({
      options: {
        command: CommandInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' },
          annotations: {
            client: {
              token: '...',
              user: { id: uuid(), claims: { sub: uuid() }},
              ip: '127.0.0.1'
            },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          }
        })
      },
      excludes: [ 'command.*' ],
      async run (options) {
        await commandstore.saveCommand(options);
      }
    });
  });

  suite('getUnhandledCommand', () => {
    test('is a function.', async () => {
      assert.that(commandstore.getUnhandledCommand).is.ofType('function');
    });
  });

  suite('progressCommand', () => {
    test('is a function.', async () => {
      assert.that(commandstore.progressCommand).is.ofType('function');
    });

    getOptionTests({
      options: {
        commandId: uuid()
      },
      async run (options) {
        await commandstore.progressCommand(options);
      }
    });
  });

  suite('removeCommand', () => {
    test('is a function.', async () => {
      assert.that(commandstore.removeCommand).is.ofType('function');
    });

    getOptionTests({
      options: {
        commandId: uuid()
      },
      async run (options) {
        await commandstore.removeCommand(options);
      }
    });
  });

  suite('destroy', () => {
    test('is a function.', async () => {
      assert.that(commandstore.destroy).is.ofType('function');
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
