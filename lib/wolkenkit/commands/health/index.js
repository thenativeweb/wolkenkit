'use strict';

const checkCertificate = require('./checkCertificate'),
      checkDockerServerResolvesToApplicationAddresses = require('./checkDockerServerResolvesToApplicationAddresses'),
      noop = require('../../../noop'),
      resolveHost = require('./resolveHost'),
      shared = require('../shared');

const health = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }

  const { directory, env } = options;

  const configuration = await shared.getConfiguration({
    env,
    directory,
    isPackageJsonRequired: true
  }, progress);

  await shared.checkDocker({ configuration, env }, progress);

  const applicationAddresses = await resolveHost({ configuration, env }, progress);

  await checkDockerServerResolvesToApplicationAddresses({ configuration, env, applicationAddresses }, progress);
  await checkCertificate({ configuration, env, directory }, progress);
};

module.exports = health;
