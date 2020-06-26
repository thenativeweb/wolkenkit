import { compileWithTypeScript } from './compileWithTypeScript';
import { isTypeScript } from 'is-typescript';
import path from 'path';
import { cp, mkdir, rm } from 'shelljs';

const buildApplication = async function ({ applicationDirectory, buildDirectoryOverride }: {
  applicationDirectory: string;
  buildDirectoryOverride?: string;
}): Promise<void> {
  const serverDirectory = path.join(applicationDirectory, 'server');
  const buildDirectory = buildDirectoryOverride ?? path.join(applicationDirectory, 'build');

  rm('-rf', buildDirectory);

  if (await isTypeScript({ directory: applicationDirectory })) {
    await compileWithTypeScript({
      sourceDirectory: applicationDirectory,
      targetDirectory: buildDirectory
    });

    return;
  }

  mkdir('-p', path.join(buildDirectory, 'server'));
  cp('-r', `${serverDirectory}/*`, path.join(buildDirectory, 'server'));
};

export { buildApplication };
