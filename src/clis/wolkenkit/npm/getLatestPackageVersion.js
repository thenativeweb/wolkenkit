'use strict';

const shell = require('../shell');

const getLatestPackageVersion = async function (name) {
  if (!name) {
    throw new Error('Name is missing.');
  }

  const output = await shell.exec(`npm view ${name} version`, { silent: true });

  const latestPackageVersion = output.stdout.replace(/(?<eol>\r\n|\n|\r)/ugm, '');

  return latestPackageVersion;
};

module.exports = getLatestPackageVersion;
