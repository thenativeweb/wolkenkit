'use strict';

const path = require('path');

const checkDirectory = require('./checkDirectory'),
      cloneRepository = require('./cloneRepository'),
      forceInit = require('./forceInit'),
      noop = require('../../../noop'),
      shell = require('../../../shell');

const init = async function ({ directory, force, template }, progress = noop) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (force === undefined) {
    throw new Error('Force is missing.');
  }
  if (!template) {
    throw new Error('Template is missing.');
  }

  if (force) {
    return await forceInit({ directory, template }, progress);
  }

  await checkDirectory({ directory, force }, progress);
  await cloneRepository({ directory, template }, progress);

  await shell.rm('-rf', path.join(directory, '.git'));
};

module.exports = init;
