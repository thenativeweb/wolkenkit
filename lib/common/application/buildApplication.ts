import { compileWithTypeScript } from './compileWithTypeScript';
import { isTypeScript } from 'is-typescript';
import path from 'path';
import shell from 'shelljs';

const buildApplication = async function ({ applicationDirectory, buildDirectoryOverride }: {
  applicationDirectory: string;
  buildDirectoryOverride?: string;
}): Promise<void> {
  const serverDirectory = path.join(applicationDirectory, 'server');
  const buildDirectory = buildDirectoryOverride ?? path.join(applicationDirectory, 'build');

  shell.rm('-rf', buildDirectory);

  if (await isTypeScript({ directory: applicationDirectory })) {
    await compileWithTypeScript({
      sourceDirectory: applicationDirectory,
      targetDirectory: buildDirectory
    });

    return;
  }

  shell.mkdir('-p', buildDirectory);
  shell.cp('-r', `${serverDirectory}/*`, buildDirectory);
};

export { buildApplication };
