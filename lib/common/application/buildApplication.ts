import { compileWithTypeScript } from './compileWithTypeScript';
import { copyNonTypeScriptFiles } from './copyNonTypeScriptFiles';
import { isTypeScript } from 'is-typescript';
import path from 'path';
import { cp, mkdir, rm } from 'shelljs';

const buildApplication = async function ({ applicationDirectory, buildDirectoryOverride }: {
  applicationDirectory: string;
  buildDirectoryOverride?: string;
}): Promise<void> {
  const serverDirectory = path.join(applicationDirectory, 'server');
  const buildDirectory = buildDirectoryOverride ?? path.join(applicationDirectory, 'build');
  const buildServerDirectory = path.join(buildDirectory, 'server');

  rm('-rf', buildDirectory);

  if (await isTypeScript({ directory: applicationDirectory })) {
    await compileWithTypeScript({
      sourceDirectory: applicationDirectory,
      targetDirectory: buildDirectory
    });

    await copyNonTypeScriptFiles({
      sourceDirectory: serverDirectory,
      targetDirectory: buildServerDirectory
    });

    return;
  }

  mkdir('-p', buildServerDirectory);
  cp('-r', `${serverDirectory}/*`, buildServerDirectory);
};

export { buildApplication };
