import { arrayToSentence } from '../../common/utils/arrayToSentence';
import { BuildOptions } from './BuildOptions';
import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import { errors } from '../../common/errors';
import { exec } from 'shelljs';
import fs from 'fs';
import { getApplicationPackageJson } from '../../common/application/getApplicationPackageJson';
import { getApplicationRoot } from '../../common/application/getApplicationRoot';
import { getImageName } from './getImageName';
import { map } from 'lodash';
import { modes } from './modes';
import path from 'path';
import { printFooter } from '../printFooter';
import { runtimes } from './runtimes';
import { stripIndent } from 'common-tags';
import { validateMode } from './validateMode';
import { validateRuntime } from './validateRuntime';
import { verifyDocker } from './verifyDocker';
import { version as wolkenkitVersion } from '../../../package.json';

const buildCommand = function (): Command<BuildOptions> {
  return {
    name: 'build',
    description: 'Build an application.',

    optionDefinitions: [
      {
        name: 'runtime',
        alias: 'r',
        description: `select a runtime, must be ${arrayToSentence({
          data: runtimes.map((runtime): string => runtime.id),
          conjunction: 'or',
          itemPrefix: `'`,
          itemSuffix: `'`
        })}`,
        parameterName: 'name',
        type: 'string',
        isRequired: false,
        validate: validateRuntime
      }, {
        name: 'mode',
        alias: 'm',
        description: `select a mode, must be ${arrayToSentence({
          data: modes.map((mode): string => mode.id),
          conjunction: 'or',
          itemPrefix: `'`,
          itemSuffix: `'`
        })}`,
        parameterName: 'name',
        type: 'string',
        isRequired: false,
        validate: validateMode
      }, {
        name: 'image-prefix',
        alias: 'p',
        description: 'set an image prefix, such as a user and a registry',
        parameterName: 'name',
        type: 'string',
        isRequired: false
      }, {
        name: 'push-images',
        alias: 'u',
        description: 'push images after build',
        type: 'boolean',
        isRequired: false,
        defaultValue: false
      }, {
        name: 'base-image',
        alias: 'b',
        description: `set a custom base image`,
        type: 'string',
        isRequired: false,
        defaultValue: `thenativeweb/wolkenkit:${wolkenkitVersion}`
      }
    ],

    async handle ({ options: {
      verbose,
      runtime,
      mode,
      'image-prefix': imagePrefix,
      'push-images': pushImages,
      'base-image': baseImage
    }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      let stopWaiting = buntstift.wait();

      try {
        const directory =
          await getApplicationRoot({ directory: process.cwd() });
        const { name, version, dependencies, devDependencies } =
          await getApplicationPackageJson({ directory: process.cwd() });

        if (!dependencies?.wolkenkit && !devDependencies?.wolkenkit) {
          throw new errors.ApplicationNotFound();
        }

        buntstift.info(`Verifying prerequisites...`);
        await verifyDocker();

        let selectedMode = mode,
            selectedRuntime = runtime;

        if (!selectedRuntime) {
          const selectedRuntimeName = await buntstift.select('Select a runtime:',
            map(runtimes, 'name'));

          selectedRuntime = runtimes.find(
            (temp): boolean => temp.name === selectedRuntimeName
          )!.id;
        }

        if (!selectedMode) {
          const selectedModeName = await buntstift.select('Select a mode:',
            map(modes, 'name'));

          selectedMode = modes.find(
            (temp): boolean => temp.name === selectedModeName
          )!.id;
        }

        buntstift.info(`Building the '${name}' application...`);

        const dockerImages: string[] = [];

        switch (selectedRuntime) {
          case 'single-process': {
            const imageName = getImageName({ name, version, mode: selectedMode, imagePrefix });

            const dockerfilePath = path.join(process.cwd(), `Dockerfile.${name}`);
            const dockerfile = stripIndent`
              FROM ${baseImage}

              RUN mkdir /app
              ADD ./package.json /app/package.json

              RUN cd /app && \
                  npm install --production

              CMD [ "node", "/app/node_modules/wolkenkit/build/lib/runtimes/singleProcess/processes/main/app.js" ]
            `;

            const dockerignorePath = `${dockerfilePath}.dockerignore`;
            const dockerignore = stripIndent`
              **
              !/server/**
              !/package.json
              !/package-lock.json
              !/tsconfig.json
            `;

            await fs.promises.writeFile(dockerfilePath, dockerfile, 'utf8');
            await fs.promises.writeFile(dockerignorePath, dockerignore, 'utf8');

            stopWaiting();
            buntstift.line();

            const { code } = exec(`docker build -t '${imageName}' -f '${dockerfilePath}' .`, { cwd: directory });

            buntstift.line();
            stopWaiting = buntstift.wait();

            if (code !== 0) {
              throw new errors.DockerBuildFailed();
            }

            dockerImages.push(imageName);

            break;
          }
          case 'microservice': {
            break;
          }
          default:
            throw new errors.InvalidOperation();
        }

        if (pushImages) {
          buntstift.info(`Pushing Docker images...`);
          stopWaiting();
          buntstift.line();

          for (const dockerImage of dockerImages) {
            const { code } = exec(`docker push ${dockerImage}`);

            if (code !== 0) {
              buntstift.line();
              stopWaiting = buntstift.wait();
              throw new errors.DockerPushFailed();
            }
          }

          buntstift.line();
          stopWaiting = buntstift.wait();
          buntstift.info(`Pushed Docker images.`);
        }

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
