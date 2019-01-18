'use strict';

const path = require('path');

const checkDirectory = require('./checkDirectory'),
      cloneRepository = require('./cloneRepository'),
      forceInit = require('./forceInit'),
      noop = require('../../../noop'),
      shell = require('../../../shell');

const init = async function (options, progress = noop) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.template) {
    throw new Error('Template is missing.');
  }
  if (options.force === undefined) {
    throw new Error('Force is missing.');
  }

  const { directory, template, force } = options;

  if (force) {
    return await forceInit({ directory, template }, progress);
  }

  await checkDirectory({ directory, force }, progress);
  await cloneRepository({ directory, template }, progress);

  await shell.rm('-rf', path.join(directory, '.git'));
};

module.exports = init;
