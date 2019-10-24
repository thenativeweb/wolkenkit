import { compileWithTypeScript } from './compileWithTypeScript';
import { promises as fs } from 'fs';
import isTypeScript from 'is-typescript';
import path from 'path';
import shell from 'shelljs';

const buildApplication = async function ({ applicationDirectory }: {
  applicationDirectory: string;
}): Promise<void> {
  const serverDirectory = path.join(applicationDirectory, 'server');
  const buildDirectory = path.join(applicationDirectory, 'build');

  shell.rm('-rf', buildDirectory);

  if (await isTypeScript({ directory: applicationDirectory })) {
    const tsconfigPath = path.join(applicationDirectory, 'tsconfig.json');
    const tsconfig = await fs.readFile(tsconfigPath, 'utf-8');
    const { compilerOptions = {}} = JSON.parse(tsconfig);

    await compileWithTypeScript({
      sourceDirectory: serverDirectory,
      targetDirectory: buildDirectory,
      compilerOptions
    });

    return;
  }

  shell.mkdir('-p', buildDirectory);
  shell.cp('-r', `${serverDirectory}/*`, buildDirectory);
};

export { buildApplication };
