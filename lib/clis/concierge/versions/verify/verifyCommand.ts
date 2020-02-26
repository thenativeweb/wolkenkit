import { buntstift } from 'buntstift';
import { Command } from 'command-line-interface';
import fs from 'fs';
import { getApplicationRoot } from '../../../../common/application/getApplicationRoot';
import { getBaseImageVersionsFromDockerfile } from './getBaseImageVersionsFromDockerfile';
import { getVersionNumber } from './getVersionNumber';
import { PackageManifest } from '../../../../common/application/PackageManifest';
import path from 'path';
import { validateMode } from './validateMode';
import { VerifyOptions } from './VerifyOptions';
import { versions } from '../../../../versions';

const verifyCommand = function (): Command<VerifyOptions> {
  return {
    name: 'verify',
    description: 'Verify versions.',

    optionDefinitions: [
      {
        name: 'mode',
        alias: 'm',
        description: 'set mode',
        parameterName: 'name',
        type: 'string',
        isRequired: false,
        defaultValue: 'error',
        validate: validateMode
      }
    ],

    async handle ({ options: { verbose, mode }}): Promise<void> {
      buntstift.configure(
        buntstift.getConfiguration().
          withVerboseMode(verbose)
      );
      const stopWaiting = buntstift.wait();

      try {
        const applicationRoot = await getApplicationRoot({ directory: __dirname });

        const nodejsDockerfile = path.join(applicationRoot, 'docker', 'wolkenkit-nodejs', 'Dockerfile');
        const postgresDockerfile = path.join(applicationRoot, 'docker', 'wolkenkit-postgres', 'Dockerfile');

        const roboterPackageJsonPath = path.join(applicationRoot, 'node_modules', 'roboter', 'package.json');
        const roboterPackageJson: PackageManifest = JSON.parse(await fs.promises.readFile(roboterPackageJsonPath, 'utf8'));

        const wolkenkitPackageJsonPath = path.join(applicationRoot, 'package.json');
        const wolkenkitPackageJson: PackageManifest = JSON.parse(await fs.promises.readFile(wolkenkitPackageJsonPath, 'utf8'));

        const currentVersions: Record<string, { source: string; version: string }[]> = {
          nodejs: [
            ...(await getBaseImageVersionsFromDockerfile({
              dockerfilePath: nodejsDockerfile,
              baseImage: 'node'
            })).map((imageVersion): { source: string; version: string } => ({
              source: `${path.relative(applicationRoot, nodejsDockerfile)}#${imageVersion.line}`,
              version: getVersionNumber({ version: imageVersion.version })
            })),
            {
              source: path.relative(applicationRoot, wolkenkitPackageJsonPath),
              version: getVersionNumber({
                version: wolkenkitPackageJson.engines!.node!
              })
            }
          ],

          postgres: [
            ...(await getBaseImageVersionsFromDockerfile({
              dockerfilePath: postgresDockerfile,
              baseImage: 'postgres'
            })).map((imageVersion): { source: string; version: string } => ({
              source: `${path.relative(applicationRoot, nodejsDockerfile)}#${imageVersion.line}`,
              version: getVersionNumber({ version: imageVersion.version })
            })),
            {
              source: 'lib/version.ts',
              version: getVersionNumber({
                version: versions.dockerImages.postgres
              })
            }
          ],

          typescript: [
            {
              source: path.relative(applicationRoot, roboterPackageJsonPath),
              version: roboterPackageJson.dependencies!.typescript
            },
            {
              source: 'lib/version.ts',
              version: versions.packages.typescript
            }
          ]
        };

        buntstift.info(`Verifying versions...`);

        let foundInconsistentVersions = false;

        for (const [ name, currentVersionsByName ] of Object.entries(currentVersions)) {
          const areVersionsDifferent = currentVersionsByName.
            map((currentVersion): string => currentVersion.version).
            some((currentVersion): boolean => currentVersion !== currentVersionsByName[0].version);

          if (!areVersionsDifferent) {
            continue;
          }

          foundInconsistentVersions = true;
          buntstift.list(name);

          for (const currentVersion of currentVersionsByName) {
            buntstift.list(`'${currentVersion.version}' in '${currentVersion.source}'`, { level: 1 });
          }
        }

        if (foundInconsistentVersions) {
          if (mode === 'error') {
            buntstift.error('Versions do not match.');

            stopWaiting();
            // eslint-disable-next-line unicorn/no-process-exit
            process.exit(1);
          } else {
            buntstift.warn('Versions do not match.');

            return;
          }
        }

        buntstift.success('Verified versions.');
      } catch (ex) {
        buntstift.error('Failed to verify versions.');

        throw ex;
      } finally {
        stopWaiting();
      }
    }
  };
};

export { verifyCommand };
