'use strict';

const isInUse = require('./isInUse'),
      isPartiallyInUse = require('./isPartiallyInUse');

const getUsageStatus = async function (options) {
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

  const isRuntimeInUse = await isInUse({ configuration, env, forVersion });
  const isRuntimePartiallyInUse = await isPartiallyInUse({ configuration, env, forVersion });

  let usageStatus = 'not-used';

  if (isRuntimeInUse) {
    usageStatus = 'used';
  }
  if (isRuntimePartiallyInUse) {
    usageStatus = 'partially-used';
  }

  return usageStatus;
};

module.exports = getUsageStatus;
