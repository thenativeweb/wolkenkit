import { BuildOptions } from './BuildOptions';
import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { exec } from 'shelljs';
import { getApplicationRoot } from '../../../../common/application/getApplicationRoot';
import path from 'path';

const buildCommand = function (): Command<BuildOptions> {
  return {
    name: 'build',
    description: 'Build the documentation.',

    optionDefinitions: [],

    async handle ({ options: { verbose }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      try {
        const applicationRoot = await getApplicationRoot({ directory: __dirname });

        const documentationDirectory = path.join(applicationRoot, 'websites', 'documentation');
        const outputDirectory = path.join(applicationRoot, 'build', 'websites', 'documentation');

        buntstift.info('Building the documentation...');

        exec('npx next build', { cwd: documentationDirectory });
        exec(`npx next export -o '${outputDirectory}'`, { cwd: documentationDirectory });

        buntstift.success('Built documentation.');
      } catch (ex) {
        buntstift.error('Failed to build documentation.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { buildCommand };
