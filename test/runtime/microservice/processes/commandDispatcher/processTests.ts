import { assert } from 'assertthat';
import { Client as AwaitCommandClient } from '../../../../../lib/apis/awaitItem/http/v2/Client';
import { buildCommandWithMetadata } from '../../../../../lib/common/utils/test/buildCommandWithMetadata';
import { CommandData } from '../../../../../lib/common/elements/CommandData';
import { CommandWithMetadata } from '../../../../../lib/common/elements/CommandWithMetadata';
import { Configuration } from '../../../../../lib/runtimes/microservice/processes/commandDispatcher/Configuration';
import { configurationDefinition } from '../../../../../lib/runtimes/microservice/processes/commandDispatcher/configurationDefinition';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getSocketPaths } from '../../../../shared/getSocketPaths';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HandleCommandWithMetadataClient } from '../../../../../lib/apis/handleCommandWithMetadata/http/v2/Client';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { v4 } from 'uuid';

suite('command dispatcher process', function (): void {
  this.timeout(10_000);

  const applicationDirectory = getTestApplicationDirectory({ name: 'base' });

  const queueLockExpirationTime = 600;

  let awaitCommandClient: AwaitCommandClient<CommandWithMetadata<CommandData>>,
      commandDispatcherConfiguration: Configuration,
      handleCommandWithMetadataClient: HandleCommandWithMetadataClient,
      healthSocket: string,
      socket: string,
      stopProcess: (() => Promise<void>) | undefined;

  setup(async (): Promise<void> => {
    [ socket, healthSocket ] = await getSocketPaths({ count: 2 });

    commandDispatcherConfiguration = {
      ...getDefaultConfiguration({ configurationDefinition }),
      applicationDirectory,
      priorityQueueStoreOptions: { type: 'InMemory', expirationTime: queueLockExpirationTime },
      portOrSocket: socket,
      healthPortOrSocket: healthSocket
    };

    stopProcess = await startProcess({
      runtime: 'microservice',
      name: 'commandDispatcher',
      enableDebugMode: false,
      portOrSocket: healthSocket,
      env: toEnvironmentVariables({ configuration: commandDispatcherConfiguration, configurationDefinition })
    });

    awaitCommandClient = new AwaitCommandClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: socket,
      path: '/await-command/v2',
      createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
    });

    handleCommandWithMetadataClient = new HandleCommandWithMetadataClient({
      protocol: 'http',
      hostName: 'localhost',
      portOrSocket: socket,
      path: '/handle-command/v2'
    });
  });

  teardown(async (): Promise<void> => {
    if (stopProcess) {
      await stopProcess();
    }

    stopProcess = undefined;
  });

  suite('getHealth', (): void => {
    test('is using the health API.', async (): Promise<void> => {
      const healthClient = new HealthClient({
        protocol: 'http',
        hostName: 'localhost',
        portOrSocket: healthSocket,
        path: '/health/v2'
      });

      await assert.that(
        async (): Promise<any> => healthClient.getHealth()
      ).is.not.throwingAsync();
    });
  });

  suite('awaitCommand', (): void => {
    test('delivers a command that is sent to /handle-command/v2.', async (): Promise<void> => {
      const command = buildCommandWithMetadata({
        aggregateIdentifier: {
          context: {
            name: 'sampleContext'
          },
          aggregate: {
            name: 'sampleAggregate',
            id: v4()
          }
        },
        name: 'execute',
        data: {
          strategy: 'succeed'
        }
      });

      await handleCommandWithMetadataClient.postCommand({ command });

      const lock = await awaitCommandClient.awaitItem();

      assert.that(lock.item).is.equalTo(command);
    });
  });
});
