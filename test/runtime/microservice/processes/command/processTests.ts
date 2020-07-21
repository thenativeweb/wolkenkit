import { assert } from 'assertthat';
import { Client as AwaitCommandClient } from '../../../../../lib/apis/awaitItem/http/v2/Client';
import { Command } from '../../../../../lib/common/elements/Command';
import { CommandData } from '../../../../../lib/common/elements/CommandData';
import { Configuration as CommandDispatcherConfiguration } from '../../../../../lib/runtimes/microservice/processes/commandDispatcher/Configuration';
import { configurationDefinition as commandDispatcherConfigurationDefinition } from '../../../../../lib/runtimes/microservice/processes/commandDispatcher/configurationDefinition';
import { CommandWithMetadata } from '../../../../../lib/common/elements/CommandWithMetadata';
import { Configuration } from '../../../../../lib/runtimes/microservice/processes/command/Configuration';
import { configurationDefinition } from '../../../../../lib/runtimes/microservice/processes/command/configurationDefinition';
import { getAvailablePorts } from '../../../../../lib/common/utils/network/getAvailablePorts';
import { getDefaultConfiguration } from '../../../../../lib/runtimes/shared/getDefaultConfiguration';
import { getTestApplicationDirectory } from '../../../../shared/applications/getTestApplicationDirectory';
import { Client as HandleCommandClient } from '../../../../../lib/apis/handleCommand/http/v2/Client';
import { Client as HealthClient } from '../../../../../lib/apis/getHealth/http/v2/Client';
import { ItemIdentifier } from '../../../../../lib/common/elements/ItemIdentifier';
import path from 'path';
import { sleep } from '../../../../../lib/common/utils/sleep';
import { startCatchAllServer } from '../../../../shared/runtime/startCatchAllServer';
import { startProcess } from '../../../../../lib/runtimes/shared/startProcess';
import { toEnvironmentVariables } from '../../../../../lib/runtimes/shared/toEnvironmentVariables';
import { uuid } from 'uuidv4';

const certificateDirectory = path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io');

suite('command', (): void => {
  suite('without retries', function (): void {
    this.timeout(10_000);

    const applicationDirectory = getTestApplicationDirectory({ name: 'base' }),
          identityProviders = [{ issuer: 'https://token.invalid', certificate: certificateDirectory }];

    let awaitCommandClient: AwaitCommandClient<CommandWithMetadata<CommandData>>,
        commandConfiguration: Configuration,
        commandDispatcherHealthPort: number,
        commandDispatcherPort: number,
        handleCommandClient: HandleCommandClient,
        healthPort: number,
        port: number,
        stopCommandDispatcherProcess: (() => Promise<void>) | undefined,
        stopProcess: (() => Promise<void>) | undefined;

    setup(async (): Promise<void> => {
      [ port, healthPort, commandDispatcherPort, commandDispatcherHealthPort ] = await getAvailablePorts({ count: 4 });

      const commandDispatcherConfiguration: CommandDispatcherConfiguration = {
        ...getDefaultConfiguration({ configurationDefinition: commandDispatcherConfigurationDefinition }),
        applicationDirectory,
        priorityQueueStoreOptions: { expirationTime: 600 },
        port: commandDispatcherPort,
        healthPort: commandDispatcherHealthPort,
        missedCommandRecoveryInterval: 600
      };

      stopCommandDispatcherProcess = await startProcess({
        runtime: 'microservice',
        name: 'commandDispatcher',
        enableDebugMode: false,
        port: commandDispatcherHealthPort,
        env: toEnvironmentVariables({
          configuration: commandDispatcherConfiguration,
          configurationDefinition: commandDispatcherConfigurationDefinition
        })
      });

      awaitCommandClient = new AwaitCommandClient({
        protocol: 'http',
        hostName: 'localhost',
        port: commandDispatcherPort,
        path: '/await-command/v2',
        createItemInstance: ({ item }: { item: CommandWithMetadata<CommandData> }): CommandWithMetadata<CommandData> => new CommandWithMetadata<CommandData>(item)
      });

      commandConfiguration = {
        ...getDefaultConfiguration<Configuration>({ configurationDefinition }),
        applicationDirectory,
        port,
        healthPort,
        commandDispatcherHostName: 'localhost',
        commandDispatcherPort,
        commandDispatcherRetries: 0,
        identityProviders
      };

      stopProcess = await startProcess({
        runtime: 'microservice',
        name: 'command',
        enableDebugMode: false,
        port: healthPort,
        env: toEnvironmentVariables({ configuration: commandConfiguration, configurationDefinition })
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
      if (stopCommandDispatcherProcess) {
        await stopCommandDispatcherProcess();
      }

      stopProcess = undefined;
      stopCommandDispatcherProcess = undefined;
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
      test('sends commands to the correct endpoint at the command dispatcher.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        await handleCommandClient.postCommand({ command });

        const result = await awaitCommandClient.awaitItem();

        assert.that(result.item).is.atLeast({
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

      test('fails if sending the given command to the command dispatcher fails.', async (): Promise<void> => {
        if (stopProcess) {
          await stopProcess();
        }

        stopProcess = await startProcess({
          runtime: 'microservice',
          name: 'command',
          enableDebugMode: false,
          port: healthPort,
          env: toEnvironmentVariables({
            configuration: {
              ...commandConfiguration,
              commandDispatcherHostName: 'non-existent',
              commandDispatcherPort: 12345
            },
            configurationDefinition
          })
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
      });
    });

    suite('cancelCommand', (): void => {
      test('sends a cancel request to the correct endpoint at the command dispatcher.', async (): Promise<void> => {
        const command = new Command({
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          data: { strategy: 'succeed' }
        });

        const { id } = await handleCommandClient.postCommand({ command });

        const commandIdentifier = {
          contextIdentifier: command.contextIdentifier,
          aggregateIdentifier: command.aggregateIdentifier,
          name: command.name,
          id
        };

        await handleCommandClient.cancelCommand({ commandIdentifier });

        const awaitItemPromise = awaitCommandClient.awaitItem();
        const shortSleep = sleep({ ms: 100 });

        const result = await Promise.race([ awaitItemPromise, shortSleep ]);

        assert.that(result).is.undefined();
      });

      test('fails if sending the cancel request to the command dispatcher fails.', async (): Promise<void> => {
        if (stopProcess) {
          await stopProcess();
        }

        stopProcess = await startProcess({
          runtime: 'microservice',
          name: 'command',
          enableDebugMode: false,
          port: healthPort,
          env: toEnvironmentVariables({
            configuration: {
              ...commandConfiguration,
              commandDispatcherHostName: 'non-existent',
              commandDispatcherPort: 12345
            },
            configurationDefinition
          })
        });

        const commandIdentifier: ItemIdentifier = {
          contextIdentifier: { name: 'sampleContext' },
          aggregateIdentifier: { name: 'sampleAggregate', id: uuid() },
          name: 'execute',
          id: uuid()
        };

        await assert.that(async (): Promise<void> => {
          await handleCommandClient.cancelCommand({ commandIdentifier });
        }).is.throwingAsync();
      });
    });
  });

  suite('with retries failing', function (): void {
    this.timeout(10_000);

    const applicationDirectory = getTestApplicationDirectory({ name: 'base' }),
          commandDispatcherRetries = 5,
          identityProviders = [{ issuer: 'https://token.invalid', certificate: certificateDirectory }];

    let commandConfiguration: Configuration,
        commandDispatcherPort: number,
        handleCommandClient: HandleCommandClient,
        healthPort: number,
        port: number,
        requestCount: number,
        stopProcess: (() => Promise<void>) | undefined;

    setup(async (): Promise<void> => {
      [ port, healthPort, commandDispatcherPort ] = await getAvailablePorts({ count: 3 });

      commandConfiguration = {
        ...getDefaultConfiguration<Configuration>({ configurationDefinition }),
        applicationDirectory,
        port,
        healthPort,
        commandDispatcherHostName: 'localhost',
        commandDispatcherPort,
        commandDispatcherRetries,
        identityProviders
      };

      requestCount = 0;
      await startCatchAllServer({
        port: commandDispatcherPort,
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
        env: toEnvironmentVariables({ configuration: commandConfiguration, configurationDefinition })
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

      assert.that(requestCount).is.equalTo(commandDispatcherRetries + 1);
    });
  });

  suite('with retries succeeding', function (): void {
    this.timeout(10_000);

    const applicationDirectory = getTestApplicationDirectory({ name: 'base' }),
          commandDispatcherRetries = 5,
          identityProviders = [{ issuer: 'https://token.invalid', certificate: certificateDirectory }],
          succeedAfterTries = 3;

    let commandConfiguration: Configuration,
        commandDispatcherPort: number,
        handleCommandClient: HandleCommandClient,
        healthPort: number,
        port: number,
        requestCount: number,
        stopProcess: (() => Promise<void>) | undefined;

    setup(async (): Promise<void> => {
      [ port, healthPort, commandDispatcherPort ] = await getAvailablePorts({ count: 3 });

      commandConfiguration = {
        ...getDefaultConfiguration<Configuration>({ configurationDefinition }),
        applicationDirectory,
        port,
        healthPort,
        commandDispatcherHostName: 'localhost',
        commandDispatcherPort,
        commandDispatcherRetries,
        identityProviders
      };

      requestCount = 0;
      await startCatchAllServer({
        port: commandDispatcherPort,
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
        env: toEnvironmentVariables({ configuration: commandConfiguration, configurationDefinition })
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
