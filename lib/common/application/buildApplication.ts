import compileWithTypeScript from './compileWithTypeScript';
import isTypeScript from 'is-typescript';
import path from 'path';
import shell from 'shelljs';

const buildApplication = async function ({ directory }: {
  directory: string;
}): Promise<void> {
  const serverDirectory = path.join(directory, 'server');
  const buildDirectory = path.join(directory, 'build');

  shell.rm('-rf', buildDirectory);

  if (await isTypeScript({ directory })) {
    const { compilerOptions } = await import(path.join(directory, 'tsconfig.json'));

    await compileWithTypeScript({
      sourceDirectory: serverDirectory,
      targetDirectory: buildDirectory,
      compilerOptions
    });

    return;
  }

  shell.mkdir('-p', buildDirectory);
  shell.cp('-r', serverDirectory, buildDirectory);
};

export default buildApplication;
