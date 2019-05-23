'use strict';

const assert = require('assertthat'),
      axios = require('axios'),
      freeport = require('freeport-promise'),
      uuid = require('uuidv4');

const { Command } = require('../../../common/elements'),
      startCatchAllServer = require('../../shared/servers/startCatchAllServer'),
      startServer = require('../../shared/servers/startServer');

suite('command', () => {
  let commandReceivedByDispatcher,
      port,
      stopServer;

  setup(async function () {
    this.timeout(5 * 1000);

    const portDispatcher = await freeport();

    await startCatchAllServer({
      port: portDispatcher,
      onRequest (req, res) {
        commandReceivedByDispatcher = req.body;
        res.status(200).end();
      }
    });

    port = await freeport();

    stopServer = await startServer({
      name: 'command',
      env: {
        PORT: port,
        DISPATCHER_HOSTNAME: 'localhost',
        DISPATCHER_PORT: portDispatcher
      }
    });
  });

  teardown(async () => {
    if (stopServer) {
      await stopServer();
    }

    stopServer = undefined;
    commandReceivedByDispatcher = undefined;
  });

  suite('GET /health/v2', () => {
    test('is using the health API.', async () => {
      const { status, data } = await axios({
        method: 'get',
        url: `http://localhost:${port}/health/v2`
      });

      assert.that(status).is.equalTo(200);
      assert.that(data).is.equalTo({});
    });
  });

  suite('POST /command/v2', () => {
    test('rejects invalid commands.', async () => {
      const command = Command.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'nonExistent'
      });

      await assert.that(async () => {
        await axios({
          method: 'post',
          url: `http://localhost:${port}/command/v2`,
          data: command
        });
      }).is.throwingAsync(ex => ex.response.status === 400);
    });

    test('dispatches commands.', async () => {
      const command = Command.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' }
      });

      const { status } = await axios({
        method: 'post',
        url: `http://localhost:${port}/command/v2`,
        data: command
      });

      assert.that(status).is.equalTo(200);

      assert.that(commandReceivedByDispatcher).is.atLeast({
        ...command,
        metadata: {
          ...command.metadata,
          initiator: {
            user: { id: 'anonymous', claims: { sub: 'anonymous' }}
          }
        },
        annotations: {
          client: {
            user: { id: 'anonymous', claims: { sub: 'anonymous' }}
          }
        }
      });
    });

    test('returns 500 if dispatching the given command fails.', async () => {
      stopServer();

      stopServer = await startServer({
        name: 'command',
        env: {
          PORT: port,
          DISPATCHER_HOSTNAME: 'non-existent',
          DISPATCHER_PORT: 12345,
          DISPATCHER_DISABLE_RETRIES: true
        }
      });

      const command = Command.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' }
      });

      await assert.that(async () => {
        await axios({
          method: 'post',
          url: `http://localhost:${port}/command/v2`,
          data: command
        });
      }).is.throwingAsync(ex => ex.response.status === 500);

      assert.that(commandReceivedByDispatcher).is.undefined();
    });
  });
});
