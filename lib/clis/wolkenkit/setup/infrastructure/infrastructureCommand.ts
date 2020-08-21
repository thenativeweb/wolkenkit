import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { errors } from '../../../../common/errors';
import { getApplicationPackageJson } from '../../../../common/application/getApplicationPackageJson';
import { getApplicationRoot } from '../../../../common/application/getApplicationRoot';
import { getInfrastructureDefinition } from '../../../../common/application/getInfrastructureDefinition';
import { getLoggerService } from '../../../../common/services/getLoggerService';
import { InfrastructureOptions } from './InfrastructureOptions';
import path from 'path';

const infrastructureCommand = function (): Command<InfrastructureOptions> {
  return {
    name: 'infrastructure',
    description: `Sets up the application's infrastructure.`,

    optionDefinitions: [],

    async handle ({ options: { verbose }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      try {
        const applicationDirectory = await getApplicationRoot({ directory: process.cwd() });
        const serverDirectory = path.join(applicationDirectory, 'build', 'server');
        const infrastructureDirectory = path.join(serverDirectory, 'infrastructure');
        const infrastructureDefinition = await getInfrastructureDefinition({ infrastructureDirectory });
        const packageManifest = await getApplicationPackageJson({ directory: applicationDirectory });

        if (!packageManifest.dependencies?.wolkenkit && !packageManifest.devDependencies?.wolkenkit) {
          buntstift.info('Application not found.');
          throw new errors.ApplicationNotFound();
        }

        buntstift.info(`Setting up infrastructure for the '${packageManifest.name}' application...`);
        await infrastructureDefinition.setupInfrastructure({
          logger: getLoggerService({
            fileName: '<app>/build/server/infrastructure/setupInfrastructure',
            packageManifest
          })
        });
        buntstift.success(`Successfully set up infrastructure for the '${packageManifest.name}' application...`);
      } catch (ex) {
        buntstift.error('Failed to set up the infrastructure.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { infrastructureCommand };
