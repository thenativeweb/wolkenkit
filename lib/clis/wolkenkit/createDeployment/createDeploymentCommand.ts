#!/usr/bin/env node

import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createDeploymentManifests } from './createDeploymentManifests';
import { CreateDeploymentOptions } from './CreateDeploymentOptions';
import { errors } from '../../../common/errors';
import { exists } from '../../../common/utils/fs/exists';
import fs from 'fs';
import path from 'path';

const createDeploymentCommand = function (): Command<CreateDeploymentOptions> {
  return {
    name: 'create-deployment',
    description: 'Create deployment manifests for a wolkenkit application.',

    optionDefinitions: [
      {
        name: 'deployment-directory',
        alias: 'd',
        description: 'set a deployment directory',
        type: 'string',
        parameterName: 'path',
        isRequired: false,
        defaultValue: `.${path.sep}deployment`
      }
    ],

    async handle ({ options: {
      verbose,
      'deployment-directory': deploymentDirectory
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      try {
        const applicationDirectory = process.cwd();
        let applicationName;

        try {
          const packageJsonPath = path.join(applicationDirectory, 'package.json');
          const packageJsonContent = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));

          applicationName = packageJsonContent.name;
        } catch {
          buntstift.info('Application not found.');
          throw new errors.ApplicationNotFound();
        }

        const targetDirectory = path.resolve(applicationDirectory, deploymentDirectory);

        if (await exists({ path: targetDirectory })) {
          buntstift.info(`The directory '${targetDirectory}' already exists.`);
          throw new errors.DirectoryAlreadyExists();
        }

        buntstift.info('Creating deployment manifests...');
        await createDeploymentManifests({ directory: targetDirectory, name: applicationName });
        buntstift.success('Created deployment manifests.');
      } catch (ex) {
        buntstift.error('Failed to create deployment manifests.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { createDeploymentCommand };
