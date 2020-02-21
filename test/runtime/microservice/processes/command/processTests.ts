import { assert } from 'assertthat';
import { Command } from '../../../../../lib/common/elements/Command';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HandleCommandClient } from '../../../../../lib/apis/handleCommand/http/v2/Client';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import path from 'path';
import { startCatchAllServer } from '../../../../shared/runtime/startCatchAllServer';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { uuid } from 'uuidv4';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite('command', (): void => {
  suite('without retries', function (): void {
    this.timeout(10_000);

    const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

    let commandReceivedByDispatcher: object | undefined,
        dispatcherPort: number,
        endpointCommandWasSentTo: string | undefined,
        handleCommandClient: HandleCommandClient,
        healthPort: number,
        port: number,
        stopProcess: (() => Promise<void>) | undefined;

    setup(async (): Promise<void> => {
      [ port, healthPort, dispatcherPort ] = await getAvailablePorts({ count: 3 });

      await startCatchAllServer({
        port: dispatcherPort,
        onRequest (req, res): void {
          endpointCommandWasSentTo = req.path;
          commandReceivedByDispatcher = req.body;
          res.status(200).end();
        }
      });

      stopProcess = await startProcess({
        runtime: 'microservice',
        name: 'command',
        enableDebugMode: false,
        port: healthPort,
        env: {
          APPLICATION_DIRECTORY: applicationDirectory,
          PORT: String(port),
          HEALTH_PORT: String(healthPort),
          DISPATCHER_PROTOCOL: 'http',
          DISPATCHER_HOST_NAME: 'localhost',
          DISPATCHER_PORT: String(dispatcherPort),
          DISPATCHER_RETRIES: String(0),
          IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`
        }
      });

      handleCommandClient = new HandleCommandClient({
        protocol: 'http',
        hostName: 'localhost',
        port,
        path: '/command/v2'
      });
    });

    teardown(async (): Promise<void> => {
      if (stopProcess) {
        await stopProcess();
      }

      stopProcess = undefined;
      commandReceivedByDispatcher = undefined;
    });

    suite('getHealth', (): void => {
      test('is using the health API.', async (): Promise<void> => {
        const healthClient = new HealthClient({
          protocol: 'http',
          hostName: 'localhost',
          port: healthPort,
          path: '/health/v2'
        });

        await assert.that(
          async (): Promise<any> => healthClient.getHealth()
        ).is.not.throwingAsync();
      });
    });

    suite('postCommand', (): void => {
      test('sends commands to the right endpoint at the dispatcher.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await handleCommandClient.postCommand({ command });

        assert.that(endpointCommandWasSentTo).is.equalTo('/handle-command/v2/');
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

      test('fails if sending the given command to the dispatcher fails.', async (): Promise<void> => {
        if (stopProcess) {
          await stopProcess();
        }

        stopProcess = await startProcess({
          runtime: 'microservice',
          name: 'command',
          enableDebugMode: false,
          port: healthPort,
          env: {
            APPLICATION_DIRECTORY: applicationDirectory,
            PORT: String(port),
            HEALTH_PORT: String(healthPort),
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
          await handleCommandClient.postCommand({ command });
        }).is.throwingAsync();

        assert.that(commandReceivedByDispatcher).is.undefined();
      });
    });
  });

  suite('with retries failing', function (): void {
    this.timeout(10_000);

    const applicationDirectory = getTestApplicationDirectory({ name: 'base' }),
          dispatcherRetries = 5;

    let dispatcherPort: number,
        handleCommandClient: HandleCommandClient,
        healthPort: number,
        port: number,
        requestCount: number,
        stopProcess: (() => Promise<void>) | undefined;

    setup(async (): Promise<void> => {
      [ port, healthPort, dispatcherPort ] = await getAvailablePorts({ count: 3 });

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
        enableDebugMode: false,
        port: healthPort,
        env: {
          APPLICATION_DIRECTORY: applicationDirectory,
          PORT: String(port),
          HEALTH_PORT: String(healthPort),
          DISPATCHER_PROTOCOL: 'http',
          DISPATCHER_HOST_NAME: 'localhost',
          DISPATCHER_PORT: String(dispatcherPort),
          DISPATCHER_RETRIES: String(dispatcherRetries),
          IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`
        }
      });

      handleCommandClient = new HandleCommandClient({
        protocol: 'http',
        hostName: 'localhost',
        port,
        path: '/command/v2'
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

      await assert.that(
        async (): Promise<any> => await handleCommandClient.postCommand({ command })
      ).is.throwingAsync();

      assert.that(requestCount).is.equalTo(dispatcherRetries + 1);
    });
  });

  suite('with retries succeeding', function (): void {
    this.timeout(10_000);

    const applicationDirectory = getTestApplicationDirectory({ name: 'base' }),
          dispatcherRetries = 5,
          succeedAfterTries = 3;

    let dispatcherPort: number,
        handleCommandClient: HandleCommandClient,
        healthPort: number,
        port: number,
        requestCount: number,
        stopProcess: (() => Promise<void>) | undefined;

    setup(async (): Promise<void> => {
      [ port, healthPort, dispatcherPort ] = await getAvailablePorts({ count: 3 });

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
        enableDebugMode: false,
        port: healthPort,
        env: {
          APPLICATION_DIRECTORY: applicationDirectory,
          PORT: String(port),
          HEALTH_PORT: String(healthPort),
          DISPATCHER_PROTOCOL: 'http',
          DISPATCHER_HOST_NAME: 'localhost',
          DISPATCHER_PORT: String(dispatcherPort),
          DISPATCHER_RETRIES: String(dispatcherRetries),
          IDENTITY_PROVIDERS: `[{"issuer": "https://token.invalid", "certificate": "${certificateDirectory}"}]`
        }
      });

      handleCommandClient = new HandleCommandClient({
        protocol: 'http',
        hostName: 'localhost',
        port,
        path: '/command/v2'
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

      await handleCommandClient.postCommand({ command });

      assert.that(requestCount).is.equalTo(succeedAfterTries);
    });
  });
});
