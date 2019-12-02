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

suite('command', function (): void {
  this.timeout(10 * 1000);

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
        DISPATCHER_HOST_NAME: 'localhost',
        DISPATCHER_PORT: String(dispatcherPort),
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
          DISPATCHER_SERVER_HOSTNAME: 'non-existent',
          DISPATCHER_SERVER_PORT: String(12345),
          DISPATCHER_SERVER_DISABLE_RETRIES: String(true),
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
