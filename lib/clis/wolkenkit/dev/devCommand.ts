import { buildApplication } from '../../../common/application/buildApplication';
import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { configurationDefinition } from '../../../runtimes/singleProcess/processes/main/configurationDefinition';
import { DevOptions } from './DevOptions';
import { errors } from '../../../common/errors';
import { getAbsolutePath } from '../../../common/utils/path/getAbsolutePath';
import { getApplicationPackageJson } from '../../../common/application/getApplicationPackageJson';
import { getApplicationRoot } from '../../../common/application/getApplicationRoot';
import { startProcess } from '../../../runtimes/shared/startProcess';
import { toEnvironmentVariables } from '../../../runtimes/shared/toEnvironmentVariables';
import { validatePort } from './validatePort';

const devCommand = function (): Command<DevOptions> {
  return {
    name: 'dev',
    description: 'Run an application in development mode.',

    optionDefinitions: [
      {
        name: 'port',
        alias: 'p',
        description: 'set a port',
        parameterName: 'port',
        type: 'number',
        isRequired: false,
        defaultValue: 3_000,
        validate: validatePort
      },
      {
        name: 'health-port',
        alias: 'e',
        description: 'set a port for the health endpoint',
        parameterName: 'port',
        type: 'number',
        isRequired: false,
        defaultValue: 3_001,
        validate: validatePort
      },
      {
        name: 'identity-provider-issuer',
        alias: 'i',
        description: 'set an identity provider issuer url',
        parameterName: 'url',
        type: 'string',
        isRequired: false
      },
      {
        name: 'identity-provider-certificate',
        alias: 'c',
        description: 'set an identity provider certificate directory',
        parameterName: 'directory',
        type: 'string',
        isRequired: false
      },
      {
        name: 'debug',
        alias: 'd',
        description: 'enable debug mode',
        type: 'boolean',
        defaultValue: false,
        isRequired: false
      }
    ],

    async handle ({ options: {
      verbose,
      port,
      'health-port': healthPort,
      'identity-provider-issuer': identityProviderIssuer,
      'identity-provider-certificate': identityProviderCertificate,
      debug
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      try {
        const applicationDirectory =
          await getApplicationRoot({ directory: process.cwd() });
        const { name, dependencies, devDependencies } =
          await getApplicationPackageJson({ directory: process.cwd() });

        if (!dependencies?.wolkenkit && !devDependencies?.wolkenkit) {
          buntstift.info('Application not found.');
          throw new errors.ApplicationNotFound();
        }

        const identityProviders = [];

        if (identityProviderIssuer && identityProviderCertificate) {
          identityProviders.push({
            issuer: identityProviderIssuer,
            certificate: getAbsolutePath({ path: identityProviderCertificate, cwd: process.cwd() })
          });
        }

        const env: NodeJS.ProcessEnv = {
          ...toEnvironmentVariables({
            configuration: {
              applicationDirectory,
              commandQueueRenewInterval: 5_000,
              concurrentCommands: 100,
              concurrentFlows: configurationDefinition.concurrentFlows.defaultValue,
              consumerProgressStoreOptions: configurationDefinition.consumerProgressStoreOptions.defaultValue,
              corsOrigin: '*',
              domainEventStoreOptions: { type: 'InMemory' },
              enableOpenApiDocumentation: true,
              fileStoreOptions: { type: 'InMemory' },
              graphqlApi: { enableIntegratedClient: true },
              healthPort,
              httpApi: true,
              identityProviders,
              lockStoreOptions: { type: 'InMemory' },
              port,
              priorityQueueStoreForCommandsOptions: configurationDefinition.priorityQueueStoreForCommandsOptions.defaultValue,
              priorityQueueStoreForDomainEventsOptions: configurationDefinition.priorityQueueStoreForDomainEventsOptions.defaultValue,
              pubSubOptions: {
                channelForNotifications: 'notification',
                publisher: { type: 'InMemory' },
                subscriber: { type: 'InMemory' }
              },
              snapshotStrategy: {
                name: 'revision',
                configuration: { revisionLimit: 100 }
              }
            },
            configurationDefinition
          }),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          LOG_LEVEL: 'debug',

          // Here, we don't want the environment variables to be parsed, but
          // instead we need their raw values. This is why we do not use the
          // processenv module here, but rely on process.env directly.
          // eslint-disable-next-line no-process-env
          ...process.env
        };

        buntstift.verbose(`Compiling the '${name}' application...`);
        await buildApplication({ applicationDirectory });
        buntstift.verbose(`Compiled the '${name}' application.`);
        if (verbose) {
          buntstift.newLine();
        }

        buntstift.info(`Starting the '${name}' application...`);
        buntstift.newLine();
        buntstift.info(`  API port     ${env.PORT}`);
        buntstift.info(`  Health port  ${env.HEALTH_PORT}`);
        buntstift.newLine();
        buntstift.info(`To stop the '${name}' application, press <Ctrl>+<C>.`);
        buntstift.line();

        stopWaiting();

        await startProcess({
          runtime: 'singleProcess',
          name: 'main',
          enableDebugMode: debug,
          port: Number(env.HEALTH_PORT),
          env,
          onExit (exitCode): void {
            // eslint-disable-next-line unicorn/no-process-exit
            process.exit(exitCode);
          }
        });
      } catch (ex: unknown) {
        buntstift.error('Failed to run the application.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { devCommand };
