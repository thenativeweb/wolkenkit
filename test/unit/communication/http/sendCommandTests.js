'use strict';

const assert = require('assertthat'),
      getOptionTests = require('get-option-tests'),
      nock = require('nock'),
      uuid = require('uuidv4');

const { CommandExternal, CommandInternal } = require('../../../../common/elements'),
      { sendCommand } = require('../../../../communication/http');

suite('sendCommand', () => {
  test('is a function.', async () => {
    assert.that(sendCommand).is.ofType('function');
  });

  getOptionTests({
    options: {
      command: CommandExternal.create({
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

  suite('CommandExternal', () => {
    test('does not throw an error if the command was sent successfully.', async () => {
      const commandSent = nock('http://localhost:3000').post('/command/v2').reply(200);

      await sendCommand({
        command: CommandExternal.create({
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

  suite('CommandInternal', () => {
    test('does not throw an error if the command was sent successfully.', async () => {
      const commandSent = nock('http://localhost:3000').post('/command/v2').reply(200);

      await sendCommand({
        command: CommandInternal.create({
          context: { name: 'sampleContext' },
          aggregate: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          annotations: {
            client: {
              token: '...',
              user: { id: uuid(), claims: { sub: uuid() }},
              ip: '127.0.0.1'
            },
            initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
          }
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
});
