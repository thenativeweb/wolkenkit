'use strict';

const assert = require('assertthat'),
      uuid = require('uuidv4');

const { Command } = require('../../../../common/elements'),
      { Sequencer } = require('../../../../handlers/domain'),
      sleep = require('../../../../common/utils/sleep');

suite('Sequencer', () => {
  test('is a function.', async () => {
    assert.that(Sequencer).is.ofType('function');
  });

  test('throws an error if concurrency is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Sequencer({
        onHandle () {
          // Intentionally left blank.
        }
      });
      /* eslint-enable no-new */
    }).is.throwing('Concurrency is missing.');
  });

  test('throws an error if on handle is missing.', async () => {
    assert.that(() => {
      /* eslint-disable no-new */
      new Sequencer({
        concurrency: 256
      });
      /* eslint-enable no-new */
    }).is.throwing('On handle is missing.');
  });

  suite('add', () => {
    let sequencer;

    setup(async () => {
      sequencer = new Sequencer({
        concurrency: 256,
        onHandle () {
          // Intentionally left blank.
        }
      });
    });

    test('is a function.', async () => {
      assert.that(sequencer.add).is.ofType('function');
    });

    test('throws an error if command is missing.', async () => {
      await assert.that(async () => {
        await sequencer.add({});
      }).is.throwingAsync('Command is missing.');
    });

    test('adds the given command.', async () => {
      let handledCommand;

      sequencer = new Sequencer({
        concurrency: 256,
        async onHandle ({ command }) {
          handledCommand = command;
        }
      });

      const command = Command.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand'
      });

      await sequencer.add({ command });

      assert.that(handledCommand).is.equalTo(command);
    });

    test('executes commands for the same aggregate one after the other.', async () => {
      const handledCommands = [];

      sequencer = new Sequencer({
        concurrency: 256,
        async onHandle ({ command }) {
          await sleep({ ms: command.data.delay });

          handledCommands.push(command);
        }
      });

      const aggregateId = uuid();

      const commandSlow = Command.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        name: 'sampleCommand',
        data: { delay: 50 }
      });
      const commandFast = Command.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: aggregateId },
        name: 'sampleCommand',
        data: { delay: 25 }
      });

      await Promise.all([
        sequencer.add({ command: commandSlow }),
        sequencer.add({ command: commandFast })
      ]);

      assert.that(handledCommands[0]).is.equalTo(commandSlow);
      assert.that(handledCommands[1]).is.equalTo(commandFast);
    });

    test('executes commands for different aggregates in parallel.', async () => {
      const handledCommands = [];

      sequencer = new Sequencer({
        concurrency: 256,
        async onHandle ({ command }) {
          await sleep({ ms: command.data.delay });

          handledCommands.push(command);
        }
      });

      const commandSlow = Command.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand',
        data: { delay: 50 }
      });
      const commandFast = Command.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'sampleCommand',
        data: { delay: 25 }
      });

      await Promise.all([
        sequencer.add({ command: commandSlow }),
        sequencer.add({ command: commandFast })
      ]);

      assert.that(handledCommands[0]).is.equalTo(commandFast);
      assert.that(handledCommands[1]).is.equalTo(commandSlow);
    });
  });
});
