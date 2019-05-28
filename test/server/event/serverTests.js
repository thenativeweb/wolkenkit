'use strict';

const assert = require('assertthat'),
      axios = require('axios'),
      freeport = require('freeport-promise'),
      uuid = require('uuidv4');

const asJsonStream = require('../../shared/http/asJsonStream'),
      { EventInternal } = require('../../../common/elements'),
      startServer = require('../../shared/servers/startServer');

suite('event', function () {
  this.timeout(5 * 1000);

  let portExternal,
      portInternal,
      stopServer;

  setup(async () => {
    portExternal = await freeport();
    portInternal = await freeport();

    stopServer = await startServer({
      name: 'event',
      port: portExternal,
      env: {
        PORT_EXTERNAL: portExternal,
        PORT_INTERNAL: portInternal
      }
    });
  });

  teardown(async () => {
    if (stopServer) {
      await stopServer();
    }

    stopServer = undefined;
  });

  suite('GET /health/v2', () => {
    suite('external', () => {
      test('is using the health API.', async () => {
        const { status, data } = await axios({
          method: 'get',
          url: `http://localhost:${portExternal}/health/v2`
        });

        assert.that(status).is.equalTo(200);
        assert.that(data).is.equalTo({});
      });
    });

    suite('internal', () => {
      test('is using the health API.', async () => {
        const { status, data } = await axios({
          method: 'get',
          url: `http://localhost:${portInternal}/health/v2`
        });

        assert.that(status).is.equalTo(200);
        assert.that(data).is.equalTo({});
      });
    });
  });

  suite('POST /event/v2 (internal)', () => {
    test('rejects invalid events.', async () => {
      const event = EventInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'nonExistent',
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      await assert.that(async () => {
        await axios({
          method: 'post',
          url: `http://localhost:${portInternal}/event/v2`,
          data: event
        });
      }).is.throwingAsync(ex => ex.response.status === 400);
    });

    test('forwards events to the external event API.', async () => {
      const event = EventInternal.create({
        context: { name: 'sampleContext' },
        aggregate: { name: 'sampleAggregate', id: uuid() },
        name: 'executed',
        data: { strategy: 'succeed' },
        metadata: {
          revision: { aggregate: 1 },
          initiator: { user: { id: uuid(), claims: { sub: uuid() }}}
        },
        annotations: { state: {}, previousState: {}}
      });

      setTimeout(async () => {
        const { status } = await axios({
          method: 'post',
          url: `http://localhost:${portInternal}/event/v2`,
          data: event
        });

        assert.that(status).is.equalTo(200);
      }, 50);

      await new Promise(async (resolve, reject) => {
        try {
          const { data } = await axios({
            method: 'get',
            url: `http://localhost:${portExternal}/events/v2`,
            responseType: 'stream'
          });

          data.pipe(asJsonStream(
            receivedEvent => {
              assert.that(receivedEvent).is.equalTo({ name: 'heartbeat' });
            },
            receivedEvent => {
              assert.that(receivedEvent.data).is.equalTo({ strategy: 'succeed' });
              resolve();
            }
          ));
        } catch (ex) {
          reject(ex);
        }
      });
    });
  });
});
