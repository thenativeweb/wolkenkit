'use strict';

const assert = require('assertthat'),
      axios = require('axios'),
      freeport = require('freeport-promise'),
      until = require('async-wait-until'),
      uuid = require('uuidv4');

const { CommandInternal } = require('../../../../../common/elements'),
      startCatchAllServer = require('../../../../shared/runtime/startCatchAllServer'),
      startProcess = require('../../../../shared/runtime/startProcess');

suite('dispatcher', function () {
  this.timeout(5 * 1000);

  let commandsReceivedByDomainServer,
      port,
      stopProcess;

  setup(async () => {
    commandsReceivedByDomainServer = [];

    const portDomainServer = await freeport();

    await startCatchAllServer({
      port: portDomainServer,
      onRequest (req, res) {
        commandsReceivedByDomainServer.push(req.body);
        res.status(200).end();
      }
    });

    port = await freeport();

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'dispatcher',
      port,
      env: {
        PORT: port,
        DOMAIN_SERVER_HOSTNAME: 'localhost',
        DOMAIN_SERVER_PORT: portDomainServer
      }
    });
  });

  teardown(async () => {
    if (stopProcess) {
      await stopProcess();
    }

    stopProcess = undefined;
    commandsReceivedByDomainServer = undefined;
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
      const command = CommandInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'nonExistent',
        annotations: {
          client: {
            token: '...',
            user: { id: uuid(), claims: { sub: uuid() }},
            ip: '127.0.0.1'
          },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        }
      });

      await assert.that(async () => {
        await axios({
          method: 'post',
          url: `http://localhost:${port}/command/v2`,
          data: command
        });
      }).is.throwingAsync(ex => ex.response.status === 400);
    });

    test('forwards commands to the domain server.', async () => {
      const command = CommandInternal.create({
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
      });

      const { status } = await axios({
        method: 'post',
        url: `http://localhost:${port}/command/v2`,
        data: command
      });

      assert.that(status).is.equalTo(200);

      await until(() => commandsReceivedByDomainServer.length === 1);

      assert.that(commandsReceivedByDomainServer.length).is.equalTo(1);
      assert.that(commandsReceivedByDomainServer[0]).is.equalTo(command);
    });
  });
});
