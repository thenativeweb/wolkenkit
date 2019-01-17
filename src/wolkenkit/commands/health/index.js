'use strict';

const checkCertificate = require('./checkCertificate'),
      checkDockerServerResolvesToApplicationAddresses = require('./checkDockerServerResolvesToApplicationAddresses'),
      noop = require('../../../noop'),
      resolveHost = require('./resolveHost'),
      shared = require('../shared');

const health = async function ({ directory, env }, progress = noop) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!env) {
    throw new Error('Environment is missing.');
  }

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: true
  }, progress);

  await shared.checkDocker({ configuration }, progress);

  const applicationAddresses = await resolveHost({ configuration }, progress);

  await checkDockerServerResolvesToApplicationAddresses({
    configuration,
    applicationAddresses
  }, progress);

  await checkCertificate({ configuration, directory }, progress);
};

module.exports = health;
