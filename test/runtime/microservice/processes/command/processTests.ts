import { assert } from 'assertthat';
import { Command } from '../../../../../lib/common/elements/Command';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import path from 'path';
import { startCatchAllServer } from '../../../../shared/runtime/startCatchAllServer';
import { startProcess } from '../../../../shared/runtime/startProcess';
import { uuid } from 'uuidv4';
import axios, { AxiosError } from 'axios';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite('command', (): void => {
  suite('without retries', function (): void {
    this.timeout(10_000);

    const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

    let commandReceivedByDispatcher: object | undefined,
        dispatcherPort: number,
        port: number,
        stopProcess: (() => Promise<void>) | undefined;

    setup(async (): Promise<void> => {
      [ port, dispatcherPort ] = await getAvailablePorts({ count: 2 });

      await startCatchAllServer({
        port: dispatcherPort,
        onRequest (req, res): void {
          commandReceivedByDispatcher = req.body;
          res.status(200).end();
        }
      });

      stopProcess = await startProcess({
        runtime: 'microservice',
        name: 'command',
        port,
        env: {
          APPLICATION_DIRECTORY: applicationDirectory,
          PORT: String(port),
          DISPATCHER_PROTOCOL: 'http',
          DISPATCHER_HOST_NAME: 'localhost',
          DISPATCHER_PORT: String(dispatcherPort),
          DISPATCHER_RETRIES: String(0),
          IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`
        }
      });
    });

    teardown(async (): Promise<void> => {
      if (stopProcess) {
        await stopProcess();
      }

      stopProcess = undefined;
      commandReceivedByDispatcher = undefined;
    });

    suite('GET /health/v2', (): void => {
      test('is using the health API.', async (): Promise<void> => {
        const { status } = await axios({
          method: 'get',
          url: `http://localhost:${port}/health/v2`
        });

        assert.that(status).is.equalTo(200);
      });
    });

    suite('POST /command/v2', (): void => {
      test('rejects invalid commands.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'nonExistent',
          data: {}
        });

        await assert.that(async (): Promise<void> => {
          await axios({
            method: 'post',
            url: `http://localhost:${port}/command/v2`,
            data: command
          });
        }).is.throwingAsync((ex): boolean => (ex as AxiosError).response!.status === 400);
      });

      test('sends commands to the dispatcher.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
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
            client: {
              user: { id: 'anonymous', claims: { sub: 'anonymous' }}
            },
            initiator: {
              user: { id: 'anonymous', claims: { sub: 'anonymous' }}
            }
          }
        });
      });

      test('returns 500 if sending the given command to the dispatcher fails.', async (): Promise<void> => {
        if (stopProcess) {
          await stopProcess();
        }

        stopProcess = await startProcess({
          runtime: 'microservice',
          name: 'command',
          port,
          env: {
            APPLICATION_DIRECTORY: applicationDirectory,
            PORT: String(port),
            DISPATCHER_PROTOCOL: 'http',
            DISPATCHER_HOST_NAME: 'non-existent',
            DISPATCHER_PORT: String(12345),
            DISPATCHER_RETRIES: String(0),
            IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`
          }
        });

        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await assert.that(async (): Promise<void> => {
          await axios({
            method: 'post',
            url: `http://localhost:${port}/command/v2`,
            data: command
          });
        }).is.throwingAsync((ex): boolean => (ex as AxiosError).response!.status === 500);

        assert.that(commandReceivedByDispatcher).is.undefined();
      });
    });
  });

  suite('with retries failing', function (): void {
    this.timeout(10_000);

    const applicationDirectory = getTestApplicationDirectory({ name: 'base' }),
          dispatcherRetries = 5;

    let dispatcherPort: number,
        port: number,
        requestCount: number,
        stopProcess: (() => Promise<void>) | undefined;

    setup(async (): Promise<void> => {
      [ port, dispatcherPort ] = await getAvailablePorts({ count: 2 });

      requestCount = 0;
      await startCatchAllServer({
        port: dispatcherPort,
        onRequest (req, res): void {
          requestCount += 1;
          res.status(500).end();
        }
      });

      stopProcess = await startProcess({
        runtime: 'microservice',
        name: 'command',
        port,
        env: {
          APPLICATION_DIRECTORY: applicationDirectory,
          PORT: String(port),
          DISPATCHER_PROTOCOL: 'http',
          DISPATCHER_HOST_NAME: 'localhost',
          DISPATCHER_PORT: String(dispatcherPort),
          DISPATCHER_RETRIES: String(dispatcherRetries),
          IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`
        }
      });
    });

    teardown(async (): Promise<void> => {
      if (stopProcess) {
        await stopProcess();
      }

      stopProcess = undefined;
    });

    test('retries as many times as configured and then crashes.', async (): Promise<void> => {
      const command = new Command({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' }
      });

      const { status } = await axios({
        method: 'post',
        url: `http://localhost:${port}/command/v2`,
        data: command,
        validateStatus (): boolean {
          return true;
        }
      });

      assert.that(status).is.equalTo(500);
      assert.that(requestCount).is.equalTo(dispatcherRetries + 1);
    });
  });

  suite('with retries succeeding', function (): void {
    this.timeout(10_000);

    const applicationDirectory = getTestApplicationDirectory({ name: 'base' }),
          dispatcherRetries = 5,
          succeedAfterTries = 3;

    let dispatcherPort: number,
        port: number,
        requestCount: number,
        stopProcess: (() => Promise<void>) | undefined;

    setup(async (): Promise<void> => {
      [ port, dispatcherPort ] = await getAvailablePorts({ count: 2 });

      requestCount = 0;
      await startCatchAllServer({
        port: dispatcherPort,
        onRequest (req, res): void {
          requestCount += 1;
          if (requestCount < succeedAfterTries) {
            return res.status(500).end();
          }
          res.status(200).end();
        }
      });

      stopProcess = await startProcess({
        runtime: 'microservice',
        name: 'command',
        port,
        env: {
          APPLICATION_DIRECTORY: applicationDirectory,
          PORT: String(port),
          DISPATCHER_PROTOCOL: 'http',
          DISPATCHER_HOST_NAME: 'localhost',
          DISPATCHER_PORT: String(dispatcherPort),
          DISPATCHER_RETRIES: String(dispatcherRetries),
          IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`
        }
      });
    });

    teardown(async (): Promise<void> => {
      if (stopProcess) {
        await stopProcess();
      }

      stopProcess = undefined;
    });

    test('retries and succeeds at some point.', async (): Promise<void> => {
      const command = new Command({
        contextIdentifier: { name: 'sampleContext' },
        aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
        name: 'execute',
        data: { strategy: 'succeed' }
      });

      const { status } = await axios({
        method: 'post',
        url: `http://localhost:${port}/command/v2`,
        data: command,
        validateStatus (): boolean {
          return true;
        }
      });

      assert.that(status).is.equalTo(200);
      assert.that(requestCount).is.equalTo(succeedAfterTries);
    });
  });
});
