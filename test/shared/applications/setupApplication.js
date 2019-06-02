'use strict';

const fs = require('fs'),
      path = require('path'),
      { promisify } = require('util');

const identity = require('lodash/identity'),
      isolated = require('isolated'),
      shell = require('shelljs');

const writeFile = promisify(fs.writeFile);

const fixPathSeparators = function (entry) {
  const entryWithFixedPathSeparators = entry.
    replace(/\//ug, path.sep).
    replace(/\\/ug, path.sep);

  return entryWithFixedPathSeparators;
};

const setupApplication = async function ({
  remove = [],
  copy = [],
  configure = identity
} = {}) {
  const directory = await isolated();

  shell.cp('-R', path.join(__dirname, 'base', 'server'), directory);
  shell.cp('-R', path.join(__dirname, 'base', 'package.json'), directory);
  shell.cp('-R', path.join(__dirname, 'base'), directory);

  const packageJsonPath = path.join(directory, 'package.json');

  /* eslint-disable global-require */
  const packageJson = require(packageJsonPath);
  /* eslint-enable global-require */

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

module.exports = setupApplication;
