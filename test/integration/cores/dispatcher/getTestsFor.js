'use strict';

const assert = require('assertthat'),
      until = require('async-wait-until'),
      uuid = require('uuidv4');

const { CommandInternal } = require('../../../../common/elements'),
      sleep = require('../../../../common/utils/sleep');

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
    test('does not throw an error.', async () => {
      await assert.that(async () => {
        await dispatcher.initialize({
          concurrency: 256,
          async onDispatch () {
            // ...
          }
        });
      }).is.not.throwingAsync();
    });
  });

  suite('schedule', () => {
    let dispatchedCommands;

    setup(async () => {
      dispatchedCommands = [];

      await dispatcher.initialize({
        concurrency: 256,
        async onDispatch ({ command }) {
          dispatchedCommands.push(command);
        }
      });
    });

    test('dispatches the given command.', async () => {
      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand',
        annotations: {
          client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await dispatcher.schedule({ command });

      await until(() => dispatchedCommands.length === 1);

      assert.that(dispatchedCommands.length).is.equalTo(1);
      assert.that(dispatchedCommands[0]).is.equalTo(command);
    });

    test('dispatches commands for the same aggregate one after the other.', async () => {
      dispatcher = new Dispatcher();

      await dispatcher.initialize({
        concurrency: 256,
        async onDispatch ({ command }) {
          await sleep({ ms: command.data.delay });

          dispatchedCommands.push(command);
        }
      });

      const aggregateId = uuid();

      const commandSlow = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        name: 'sampleCommand',
        data: { delay: 50 },
        annotations: {
          client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });
      const commandFast = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        name: 'sampleCommand',
        data: { delay: 25 },
        annotations: {
          client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await Promise.all([
        dispatcher.schedule({ command: commandSlow }),
        dispatcher.schedule({ command: commandFast })
      ]);

      await until(() => dispatchedCommands.length === 2);

      assert.that(dispatchedCommands.length).is.equalTo(2);
      assert.that(dispatchedCommands[0]).is.equalTo(commandSlow);
      assert.that(dispatchedCommands[1]).is.equalTo(commandFast);
    });

    test('dispatches commands for different aggregates in parallel.', async () => {
      dispatcher = new Dispatcher();

      await dispatcher.initialize({
        concurrency: 256,
        async onDispatch ({ command }) {
          await sleep({ ms: command.data.delay });

          dispatchedCommands.push(command);
        }
      });

      const commandSlow = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand',
        data: { delay: 50 },
        annotations: {
          client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });
      const commandFast = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand',
        data: { delay: 25 },
        annotations: {
          client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
          initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
        }
      });

      await Promise.all([
        dispatcher.schedule({ command: commandSlow }),
        dispatcher.schedule({ command: commandFast })
      ]);

      await until(() => dispatchedCommands.length === 2);

      assert.that(dispatchedCommands.length).is.equalTo(2);
      assert.that(dispatchedCommands[0]).is.equalTo(commandFast);
      assert.that(dispatchedCommands[1]).is.equalTo(commandSlow);
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
