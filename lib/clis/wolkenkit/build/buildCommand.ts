import { buildApplication } from '../../../common/application/buildApplication';
import { BuildOptions } from './BuildOptions';
import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { errors } from '../../../common/errors';
import { getApplicationPackageJson } from '../../../common/application/getApplicationPackageJson';
import { getApplicationRoot } from '../../../common/application/getApplicationRoot';
import { printFooter } from '../printFooter';

const buildCommand = function (): Command<BuildOptions> {
  return {
    name: 'build',
    description: 'Build an application written in TypeScript.',

    optionDefinitions: [],

    async handle ({ options: {
      verbose
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

        buntstift.info(`Building the '${name}' application...`);
        await buildApplication({ applicationDirectory });
        buntstift.success(`Built the '${name}' application.`);

        buntstift.newLine();
        printFooter();
      } catch (ex) {
        buntstift.error('Failed to build the application.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { buildCommand };
