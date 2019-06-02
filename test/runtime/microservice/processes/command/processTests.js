'use strict';

const assert = require('assertthat'),
      axios = require('axios'),
      freeport = require('freeport-promise'),
      uuid = require('uuidv4');

const { CommandExternal } = require('../../../../../common/elements'),
      startCatchAllServer = require('../../../../shared/runtime/startCatchAllServer'),
      startProcess = require('../../../../shared/runtime/startProcess');

suite('command', function () {
  this.timeout(5 * 1000);

  let commandReceivedByDispatcherServer,
      port,
      stopProcess;

  setup(async () => {
    const portDispatcherServer = await freeport();

    await startCatchAllServer({
      port: portDispatcherServer,
      onRequest (req, res) {
        commandReceivedByDispatcherServer = req.body;
        res.status(200).end();
      }
    });

    port = await freeport();

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'command',
      port,
      env: {
        PORT: port,
        DISPATCHER_SERVER_HOSTNAME: 'localhost',
        DISPATCHER_SERVER_PORT: portDispatcherServer
      }
    });
  });

  teardown(async () => {
    if (stopProcess) {
      await stopProcess();
    }

    stopProcess = undefined;
    commandReceivedByDispatcherServer = undefined;
  });

  suite('GET /health/v2', () => {
    test('is using the health API.', async () => {
      const { status } = await axios({
        method: 'get',
        url: `http://localhost:${port}/health/v2`
      });

      assert.that(status).is.equalTo(200);
    });
  });

  suite('POST /command/v2', () => {
    test('rejects invalid commands.', async () => {
      const command = CommandExternal.create({
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

    test('forwards commands to the dispatcher server.', async () => {
      const command = CommandExternal.create({
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

      assert.that(commandReceivedByDispatcherServer).is.atLeast({
        ...command,
        annotations: {
          client: {
            user: { id: 'anonymous', claims: { sub: 'anonymous' }}
          },
          initiator: {
            user: { id: 'anonymous', claims: { sub: 'anonymous' }}
          }
        }
      });
    });

    test('returns 500 if forwarding the given command to the dispatcher server fails.', async () => {
      stopProcess();

      stopProcess = await startProcess({
        runtime: 'microservice',
        name: 'command',
        port,
        env: {
          PORT: port,
          DISPATCHER_SERVER_HOSTNAME: 'non-existent',
          DISPATCHER_SERVER_PORT: 12345,
          DISPATCHER_SERVER_DISABLE_RETRIES: true
        }
      });

      const command = CommandExternal.create({
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

      assert.that(commandReceivedByDispatcherServer).is.undefined();
    });
  });
});
