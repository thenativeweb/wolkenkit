'use strict';

const shell = require('../shell');

const verifyInstallation = async function () {
  const applications = [
    'docker',
    'git',
    'kubectl',
    'npx',
    'nvm',
    'packer',
    'terraform'
  ];

  for (const application of applications) {
    const isInstalled = await shell.isInstalled(application);

    if (!isInstalled) {
      throw new Error(`${application} is not installed.`);
    }
  }
};

module.exports = verifyInstallation;
