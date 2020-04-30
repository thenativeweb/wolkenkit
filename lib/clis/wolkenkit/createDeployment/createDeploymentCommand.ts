#!/usr/bin/env node

import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createDeploymentManifests } from './createDeploymentManifests';
import { CreateDeploymentOptions } from './CreateDeploymentOptions';
import { exists } from '../../../common/utils/fs/exists';
import fs from 'fs';
import path from 'path';

const createDeploymentCommand = function (): Command<CreateDeploymentOptions> {
  return {
    name: 'init',
    description: 'Initialize a new application.',

    optionDefinitions: [
      {
        name: 'deployment-directory',
        description: 'the directory in which to create the deployment manifests',
        type: 'string',
        parameterName: 'path',
        isRequired: false,
        defaultValue: './deployment'
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

      try {
        const appDirectory = process.cwd();
        let applicationName;

        try {
          const packageJsonPath = path.join(appDirectory, 'package.json');
          const packageJsonContent = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf-8'));

          applicationName = packageJsonContent.name;
        } catch {
          buntstift.info('Failed to create deployment manifests.');
          buntstift.info('Please run the create-deployment command in a wolkenkit application directory.');

          return process.exit(1);
        }

        const targetDirectory = path.resolve(appDirectory, deploymentDirectory);

        if (await exists({ path: targetDirectory })) {
          buntstift.info(`Failed to create deployment manifests since the deployment directory ${targetDirectory} already exists.`);
          buntstift.info('Pass a different directory via --deployment-directory or delete the current directory first.');

          return process.exit(1);
        }

        buntstift.info('Creating deployment manifests...');
        await createDeploymentManifests({ directory: targetDirectory, name: applicationName });
        buntstift.info('Created deployment manifests.');
      } catch (ex) {
        buntstift.error('Failed to create deployment manifests.');

        throw ex;
      }
    }
  };
};

export { createDeploymentCommand };
