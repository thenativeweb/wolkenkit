'use strict';

const shell = require('../shell');

const installPackage = async function (packageName, version) {
  if (!packageName) {
    throw new Error('Name is missing.');
  }
  if (!version) {
    throw new Error('Version is missing.');
  }

  await shell.exec(`npm install -g ${packageName}@${version}`, { silent: true });
};

module.exports = installPackage;
