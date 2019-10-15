import fs from 'fs';
import identity from 'lodash/identity';
import isolated from 'isolated';
import path from 'path';
import { promisify } from 'util';
import shell from 'shelljs';

const writeFile = promisify(fs.writeFile);

const fixPathSeparators = function (entry: string): string {
  const entryWithFixedPathSeparators = entry.
    replace(/\//ug, path.sep).
    replace(/\\/ug, path.sep);

  return entryWithFixedPathSeparators;
};

const setupApplication = async function ({
  remove = [],
  copy = [],
  configure = identity
}: {
  remove?: string[];
  copy?: string[];
  configure?: (value: object) => object;
} = {}): Promise<string> {
  const directory = await isolated();

  shell.cp('-R', path.join(__dirname, 'base', 'server'), directory);
  shell.cp('-R', path.join(__dirname, 'base', 'package.json'), directory);
  shell.cp('-R', path.join(__dirname, 'base'), directory);

  const packageJsonPath = path.join(directory, 'package.json');

  const packageJson = await import(packageJsonPath);

  const updatedPackageJson = configure(packageJson);

  await writeFile(
    packageJsonPath,
    JSON.stringify(updatedPackageJson, null, 2),
    { encoding: 'utf8' }
  );

  for (const entry of remove) {
    const entryWithFixedPathSeparators = fixPathSeparators(entry);

    shell.rm('-rf', path.join(directory, entryWithFixedPathSeparators));
  }

  for (const entry of copy) {
    const entryWithFixedPathSeparators = fixPathSeparators(entry);

    shell.cp('-R', entryWithFixedPathSeparators, directory);
  }

  return directory;
};

export default setupApplication;
