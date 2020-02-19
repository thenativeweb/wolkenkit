import { arrayToSentence } from '../../common/utils/arrayToSentence';
import { buildApplication } from '../../common/application/buildApplication';
import { buntstift } from 'buntstift';
import { camelCase } from 'lodash';
import { Command } from 'command-line-interface';
import { errors } from '../../common/errors';
import { getApplicationPackageJson } from '../../common/application/getApplicationPackageJson';
import { printFooter } from '../printFooter';
import { processenv } from 'processenv';
import { RunOptions } from './RunOptions';
import { runtimes } from './runtimes';
import { startProcess } from '../../runtimes/shared/startProcess';

const runCommand = function (): Command<RunOptions> {
  return {
    name: 'run',
    description: 'Run a process from a specific runtime.',

    optionDefinitions: [
      {
        name: 'runtime',
        alias: 'r',
        description: 'set a runtime',
        parameterName: 'name',
        type: 'string',
        isRequired: true
      },
      {
        name: 'process',
        alias: 'p',
        description: 'set a process',
        parameterName: 'name',
        type: 'string',
        isRequired: true
      },
      {
        name: 'health-port',
        alias: 'e',
        description: 'set a health port',
        parameterName: 'port',
        type: 'number',
        isRequired: true
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
      runtime,
      process: processId,
      'health-port': healthPort,
      debug
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );

      const runtimeIds = runtimes.map((temp): string => temp.id);

      if (!runtimeIds.includes(runtime)) {
        buntstift.error(`Invalid runtime '${runtime}', must be ${arrayToSentence({
          data: runtimeIds,
          conjunction: 'or',
          itemPrefix: `'`,
          itemSuffix: `'`
        })}.`);

        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1);
      }

      const processIds = runtimes.find((temp): boolean =>
        temp.id === runtime)!.processes.map((temp): string => temp.id);

      if (!processIds.includes(processId)) {
        buntstift.error(`Invalid process '${processId}', must be ${arrayToSentence({
          data: processIds,
          conjunction: 'or',
          itemPrefix: `'`,
          itemSuffix: `'`
        })}.`);

        // eslint-disable-next-line unicorn/no-process-exit
        process.exit(1);
      }

      const stopWaiting = buntstift.wait();

      try {
        const { name, dependencies, devDependencies } =
          await getApplicationPackageJson({ directory: process.cwd() });

        if (!dependencies?.wolkenkit && !devDependencies?.wolkenkit) {
          buntstift.info('Application not found.');
          throw new errors.ApplicationNotFound();
        }

        buntstift.verbose(`Compiling the '${name}' application...`);
        await buildApplication({
          applicationDirectory: process.cwd()
        });
        buntstift.verbose(`Compiled the '${name}' application.`);
        if (verbose) {
          buntstift.newLine();
        }

        buntstift.info(`Starting the '${runtime}/${processId}' process...`);
        buntstift.info(`To stop the '${runtime}/${processId}' process, press <Ctrl>+<C>.`);

        buntstift.newLine();
        printFooter();

        buntstift.newLine();
        buntstift.line();

        stopWaiting();

        await startProcess({
          runtime: camelCase(runtime),
          name: camelCase(processId),
          enableDebugMode: debug,
          port: healthPort,
          env: processenv() as NodeJS.ProcessEnv,
          onExit (exitCode): void {
            // eslint-disable-next-line unicorn/no-process-exit
            process.exit(exitCode);
          }
        });
      } catch (ex) {
        buntstift.error(`Failed to run the '${runtime}/${processId}' process.`);

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { runCommand };
