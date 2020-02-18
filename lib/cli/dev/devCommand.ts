import { buildApplication } from '../../common/application/buildApplication';
import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { DevOptions } from './DevOptions';
import { emojis } from '../emojis';
import fs from 'fs';
import path from 'path';
import { processenv } from 'processenv';
import { sample } from 'lodash';
import { startProcess } from '../../runtimes/shared/startProcess';
import { validatePort } from './validatePort';

const devCommand = function (): Command<DevOptions> {
  return {
    name: 'dev',
    description: 'Run an application in development mode.',

    optionDefinitions: [
      {
        name: 'port',
        alias: 'p',
        description: 'set the port',
        parameterName: 'port',
        type: 'number',
        isRequired: false,
        defaultValue: 3000,
        validate: validatePort
      }
    ],

    async handle ({ options: { verbose, port }}): Promise<void> {
      const healthPort = port + 1;

      const { name } = JSON.parse(await fs.promises.readFile(path.join(process.cwd(), 'package.json'), 'utf8'));

      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      try {
        buntstift.verbose(`Compiling the '${name}' application...`);
        await buildApplication({
          applicationDirectory: process.cwd()
        });
        buntstift.verbose(`Compiled the '${name}' application.`);
        if (verbose) {
          buntstift.newLine();
        }

        buntstift.info(`Starting the '${name}' application...`);
        buntstift.info(`To stop the '${name}' application, press <Ctrl>+<C>.`);
        buntstift.newLine();
        buntstift.info(`  API port     ${port}`);
        buntstift.info(`  Health port  ${healthPort}`);
        buntstift.newLine();
        buntstift.info('If you experience any difficulties, please go to:');
        buntstift.newLine();
        buntstift.info('  https://docs.wolkenkit.io/latest/getting-started/understanding-wolkenkit/getting-help/');
        buntstift.newLine();
        buntstift.info(`Thank you for using wolkenkit ${sample(emojis)}`);
        buntstift.newLine();
        buntstift.line();

        stopWaiting();

        await startProcess({
          runtime: 'singleProcess',
          name: 'main',
          port,
          env: {
            ...processenv() as NodeJS.ProcessEnv,
            APPLICATION_DIRECTORY: process.cwd(),
            COMMAND_QUEUE_RENEW_INTERVAL: JSON.stringify(5_000),
            CONCURRENT_COMMANDS: JSON.stringify(100),
            CORS_ORIGIN: '*',
            DOMAIN_EVENT_STORE_OPTIONS: JSON.stringify({}),
            DOMAIN_EVENT_STORE_TYPE: 'InMemory',
            HEALTH_PORT: JSON.stringify(healthPort),
            IDENTITY_PROVIDERS: JSON.stringify([]),
            LOCK_STORE_OPTIONS: JSON.stringify({}),
            LOCK_STORE_TYPE: 'InMemory',
            LOG_LEVEL: 'debug',
            PORT: JSON.stringify(port),
            SNAPSHOT_STRATEGY: JSON.stringify({
              name: 'revision',
              configuration: {
                revisionLimit: 100
              }
            })
          },
          onExit (exitCode): void {
            // eslint-disable-next-line unicorn/no-process-exit
            process.exit(exitCode);
          }
        });
      } catch (ex) {
        buntstift.error('Failed to run the application.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { devCommand };
