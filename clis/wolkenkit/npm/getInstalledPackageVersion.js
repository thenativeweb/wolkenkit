'use strict';

const errors = require('../errors'),
      shell = require('../shell');

const getInstalledPackageVersion = async function (name) {
  if (!name) {
    throw new Error('Name is missing.');
  }

  let installedVersion = '0.0.0',
      output;

  try {
    output = await shell.exec(`npm list -g ${name}`, { silent: true });
  } catch {
    return installedVersion;
  }

  const regExp = new RegExp(`${name}@(.*?)\\s`, 'ugm');
  const matches = regExp.exec(output.stdout);

  if (!matches) {
    throw new errors.OutputMalformed();
  }

  [ , installedVersion ] = matches;

  return installedVersion;
};

module.exports = getInstalledPackageVersion;
