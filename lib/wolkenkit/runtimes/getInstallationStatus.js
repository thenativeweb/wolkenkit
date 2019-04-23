'use strict';

const isInstalled = require('./isInstalled'),
      isPartiallyInstalled = require('./isPartiallyInstalled');

const getInstallationStatus = async function ({ configuration, forVersion }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!forVersion) {
    throw new Error('Version is missing.');
  }

  const isRuntimeInstalled = await isInstalled({ configuration, forVersion });
  const isRuntimePartiallyInstalled = await isPartiallyInstalled({ configuration, forVersion });

  let installationStatus = 'not-installed';

  if (isRuntimeInstalled) {
    installationStatus = 'installed';
  }
  if (isRuntimePartiallyInstalled) {
    installationStatus = 'partially-installed';
  }

  return installationStatus;
};

module.exports = getInstallationStatus;
