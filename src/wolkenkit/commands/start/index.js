'use strict';

const aufwind = require('./aufwind'),
      cli = require('./cli'),
      noop = require('../../../noop'),
      shared = require('../shared');

const startVia = {
  aufwind,
  cli
};

const start = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (options.dangerouslyDestroyData === undefined) {
    throw new Error('Dangerously destroy data is missing.');
  }
  if (options.debug === undefined) {
    throw new Error('Debug is missing.');
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

  shared.validateCode({ directory }, progress);

  const environment = configuration.environments[env];

  const type = environment.type === 'aufwind' ? environment.type : 'cli';

  await startVia[type]({ ...options, configuration }, progress);
};

module.exports = start;
