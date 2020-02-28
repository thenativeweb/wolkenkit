import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { exec } from 'shelljs';
import { getApplicationRoot } from '../../../../common/application/getApplicationRoot';
import path from 'path';
import { RunOptions } from './RunOptions';

const runCommand = function (): Command<RunOptions> {
  return {
    name: 'run',
    description: 'Run the documentation.',

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

        buntstift.info('Running the documentation...');

        stopWaiting();

        exec('npx next dev --port 4000', { cwd: documentationDirectory });
      } catch (ex) {
        buntstift.error('Failed to run the documentation.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { runCommand };
