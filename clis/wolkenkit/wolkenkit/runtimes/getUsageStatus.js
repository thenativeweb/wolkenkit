'use strict';

const isInUse = require('./isInUse'),
      isPartiallyInUse = require('./isPartiallyInUse');

const getUsageStatus = async function ({ configuration, forVersion }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!forVersion) {
    throw new Error('Version is missing.');
  }

  const isRuntimeInUse = await isInUse({
    configuration,
    forVersion
  });
  const isRuntimePartiallyInUse = await isPartiallyInUse({
    configuration,
    forVersion
  });

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
