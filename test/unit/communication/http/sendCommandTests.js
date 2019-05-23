'use strict';

const assert = require('assertthat'),
      getOptionTests = require('get-option-tests'),
      nock = require('nock'),
      uuid = require('uuidv4');

const { Command } = require('../../../../common/elements'),
      { sendCommand } = require('../../../../communication/http');

suite('sendCommand', () => {
  test('is a function.', async () => {
    assert.that(sendCommand).is.ofType('function');
  });

  getOptionTests({
    options: {
      command: Command.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute'
      }),
      protocol: 'http',
      hostname: 'localhost',
      port: 3000,
      pathname: '/command/v2',
      retries: 4
    },
    excludes: [ 'command.*' ],
    async run (options) {
      await sendCommand(options);
    }
  });

  test('does not throw an error if the command was sent successfully.', async () => {
    const commandSent = nock('http://localhost:3000').post('/command/v2').reply(200);

    await sendCommand({
      command: Command.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute'
      }),
      protocol: 'http',
      hostname: 'localhost',
      port: 3000,
      pathname: '/command/v2',
      retries: 0
    });

    assert.that(commandSent.isDone()).is.true();
  });
});
