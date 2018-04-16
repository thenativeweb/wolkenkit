'use strict';

const isInstalled = require('./isInstalled'),
      isPartiallyInstalled = require('./isPartiallyInstalled');

const getInstallationStatus = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }
  if (!options.forVersion) {
    throw new Error('Version is missing.');
  }

  const { configuration, env, forVersion } = options;

  const isRuntimeInstalled = await isInstalled({ configuration, env, forVersion });
  const isRuntimePartiallyInstalled = await isPartiallyInstalled({ configuration, env, forVersion });

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
