import { BuildOptions } from './BuildOptions';
import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';

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
        buntstift.info('Building the documentation...');



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
