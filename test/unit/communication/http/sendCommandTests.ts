import assert from 'assertthat';
import CommandExternal from '../../../../src/common/elements/CommandExternal';
import CommandInternal from '../../../../src/common/elements/CommandInternal';
import nock from 'nock';
import sendCommand from '../../../../src/communication/http/sendCommand';
import uuid from 'uuidv4';

suite('sendCommand', (): void => {
  suite('CommandExternal', (): void => {
    test('does not throw an error if the command was sent successfully.', async (): Promise<void> => {
      const commandSent = nock('http://localhost:3000').post('/command/v2').reply(200);

      await sendCommand({
        command: CommandExternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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

  suite('CommandInternal', (): void => {
    test('does not throw an error if the command was sent successfully.', async (): Promise<void> => {
      const commandSent = nock('http://localhost:3000').post('/command/v2').reply(200);

      await sendCommand({
        command: CommandInternal.create({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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
