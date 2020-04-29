#!/usr/bin/env node

import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { createDeploymentManifests } from './createDeploymentManifests';
import { CreateDeploymentOptions } from './CreateDeploymentOptions';
import { exists } from '../../../common/utils/fs/exists';
import { getAbsolutePath } from '../../../common/utils/path/getAbsolutePath';
import { nameRegularExpression } from '../init/nameRegularExpression';
import path from 'path';
import shell from 'shelljs';
import { validateName } from '../init/validateName';

const createDeploymentCommand = function (): Command<CreateDeploymentOptions> {
  return {
    name: 'init',
    description: 'Initialize a new application.',

    optionDefinitions: [
      {
        name: 'directory',
        alias: 'd',
        description: 'a directory containing a wolkenkit application',
        parameterName: 'path',
        type: 'string',
        isRequired: false
      }, {
        name: 'deployment-directory',
        description: 'the name of the directory in which to create the deployment manifests',
        type: 'string',
        isRequired: false,
        defaultValue: 'deployment'
      }, {
        name: 'force',
        alias: 'f',
        description: 'overwrite an existing deployment directory',
        type: 'boolean',
        isRequired: false,
        defaultValue: false
      }, {
        name: 'name',
        alias: 'n',
        description: 'set an application name',
        type: 'string',
        isRequired: false,
        defaultOption: true,
        validate: validateName
      }
    ],

    async handle ({ options: {
      verbose,
      directory,
      'deployment-directory': deploymentDirectory,
      force,
      name
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      try {
        let selectedName = name;

        if (!selectedName) {
          selectedName = await buntstift.ask('Enter the application name:', nameRegularExpression);
        }

        const appDirectory = getAbsolutePath({
          path: directory ?? selectedName.replace(/\//gu, path.sep),
          cwd: process.cwd()
        });

        const targetDirectory = path.join(appDirectory, deploymentDirectory);

        const targetDirectoryExists = await exists({ path: targetDirectory });

        if (targetDirectoryExists && !force) {
          buntstift.info(`Could not create deployment manifests since the deployment directory ${targetDirectory} already exists.`);
          buntstift.info('Use the --force flag to overwrite the directory.');

          return process.exit(1);
        }

        if (targetDirectoryExists) {
          shell.rm('rf', targetDirectory);
        }

        buntstift.info('Creating deployment manifests...');
        await createDeploymentManifests({ directory: targetDirectory, name: selectedName });
        buntstift.info('Created deployment manifests.');
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
