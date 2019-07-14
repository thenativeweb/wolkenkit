'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { CommandInternal } = require('../../../../common/elements'),
      sleep = require('../../../../common/utils/sleep');

/* eslint-disable mocha/max-top-level-suites */
const getTestsFor = function ({ Commandstore, getOptions }) {
  let command,
      commandForOtherAggregate,
      commandForSameAggregate,
      commandstore,
      namespace;

  setup(() => {
    commandstore = new Commandstore();
    namespace = uuid();

    const aggregateId = uuid(),
          aggregateIdOther = uuid();

    command = CommandInternal.create({
      context: { name: 'sampleContext' },
      aggregate: { name: 'sampleAggregate', id: aggregateId },
      name: 'execute',
      data: { strategy: 'succeed' },
      annotations: {
        client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
      }
    });

    commandForSameAggregate = CommandInternal.create({
      context: { name: 'sampleContext' },
      aggregate: { name: 'sampleAggregate', id: aggregateId },
      name: 'execute',
      data: { strategy: 'fail' },
      annotations: {
        client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
      }
    });

    commandForOtherAggregate = CommandInternal.create({
      context: { name: 'sampleContext' },
      aggregate: { name: 'sampleAggregate', id: aggregateIdOther },
      name: 'execute',
      data: { strategy: 'succeed' },
      annotations: {
        client: { token: '...', user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}, ip: '127.0.0.1' },
        initiator: { user: { id: 'jane.doe', claims: { sub: 'jane.doe' }}}
      }
    });
  });

  teardown(async function () {
    this.timeout(20 * 1000);

    await commandstore.destroy();
  });

  suite('initialize', () => {
    test('does not throw an error if the database is reachable.', async () => {
      await assert.that(async () => {
        await commandstore.initialize({ ...getOptions(), namespace });
      }).is.not.throwingAsync();
    });

    test('does not throw an error if tables, indexes & co. do already exist.', async () => {
      await assert.that(async () => {
        await commandstore.initialize({ ...getOptions(), namespace });
        await commandstore.initialize({ ...getOptions(), namespace });
      }).is.not.throwingAsync();
    });
  });

  suite('saveCommand', () => {
    test('saves a command.', async () => {
      await commandstore.initialize({ ...getOptions(), namespace });

      await commandstore.saveCommand({ command });
    });
  });

  suite('getUnhandledCommand', () => {
    test('throws an error if no command was saved.', async () => {
      await commandstore.initialize({ ...getOptions(), namespace });

      await assert.that(async () => {
        await commandstore.getUnhandledCommand();
      }).is.throwingAsync('Failed to get unhandled command.');
    });

    test('returns an unhandled command.', async () => {
      await commandstore.initialize({ ...getOptions(), namespace });
      await commandstore.saveCommand({ command });

      const unhandledCommand = await commandstore.getUnhandledCommand();

      assert.that(unhandledCommand).is.equalTo(command);
    });

    test('throws an error if all saved commands are already being handled.', async () => {
      await commandstore.initialize({ ...getOptions(), namespace });
      await commandstore.saveCommand({ command });

      await commandstore.getUnhandledCommand();

      await assert.that(async () => {
        await commandstore.getUnhandledCommand();
      }).is.throwingAsync('Failed to get unhandled command.');
    });

    test('returns an unhandled command for another aggregate, if available.', async () => {
      await commandstore.initialize({ ...getOptions(), namespace });
      await commandstore.saveCommand({ command });
      await commandstore.saveCommand({ command: commandForOtherAggregate });

      await commandstore.getUnhandledCommand();

      const unhandledCommand = await commandstore.getUnhandledCommand();

      assert.that(unhandledCommand).is.equalTo(commandForOtherAggregate);
    });

    test('locks aggregates with expiration.', async () => {
      await commandstore.initialize({ ...getOptions(), namespace });
      await commandstore.saveCommand({ command });

      await commandstore.getUnhandledCommand();

      await sleep({ ms: 100 });

      const unhandledCommand = await commandstore.getUnhandledCommand();

      assert.that(unhandledCommand).is.equalTo(command);
    });
  });

  suite('progressCommand', () => {
    test('throws an error if an unknown command id is given.', async () => {
      await commandstore.initialize({ ...getOptions(), namespace });

      await assert.that(async () => {
        await commandstore.progressCommand({ commandId: uuid() });
      }).is.throwingAsync('Command not found.');
    });

    test('throws an error if the given command is not locked.', async () => {
      await commandstore.initialize({ ...getOptions(), namespace });
      await commandstore.saveCommand({ command });

      await assert.that(async () => {
        await commandstore.progressCommand({ commandId: command.id });
      }).is.throwingAsync('Failed to renew lock.');
    });

    test('renews the lock for the given command.', async () => {
      await commandstore.initialize({ ...getOptions(), namespace });
      await commandstore.saveCommand({ command });

      await commandstore.getUnhandledCommand();

      // The expiration duration is set to 50ms in the setup, so using 35ms
      // two times ensures that the lock has actually been renewed. To verify
      // this we finally try to get an unhandled command, which should fail
      // (since the only available command is still being handled).
      await sleep({ ms: 35 });
      await commandstore.progressCommand({ commandId: command.id });

      await sleep({ ms: 35 });

      await assert.that(async () => {
        await commandstore.getUnhandledCommand();
      }).is.throwingAsync('Failed to get unhandled command.');
    });
  });

  suite('removeCommand', () => {
    test('throws an error if an unknown command id is given.', async () => {
      await commandstore.initialize({ ...getOptions(), namespace });

      await assert.that(async () => {
        await commandstore.removeCommand({ commandId: uuid() });
      }).is.throwingAsync('Command not found.');
    });

    test('removes the command with the given id.', async () => {
      await commandstore.initialize({ ...getOptions(), namespace });
      await commandstore.saveCommand({ command });

      await assert.that(async () => {
        await commandstore.removeCommand({ commandId: uuid() });
      }).is.throwingAsync('Command not found.');
    });

    test('releases the lock for the aggregate of the command.', async () => {
      await commandstore.initialize({ ...getOptions(), namespace });
      await commandstore.saveCommand({ command });
      await commandstore.saveCommand({ command: commandForSameAggregate });

      await commandstore.getUnhandledCommand();
      await commandstore.removeCommand({ commandId: command.id });

      const unhandledCommand = await commandstore.getUnhandledCommand();

      assert.that(unhandledCommand).is.equalTo(commandForSameAggregate);
    });
  });
};
/* eslint-enable mocha/max-top-level-suites */

module.exports = getTestsFor;
