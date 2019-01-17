'use strict';

const fs = require('fs'),
      path = require('path');

const promisify = require('util.promisify');

const cloneRepository = require('./cloneRepository'),
      errors = require('../../../errors'),
      forceInit = require('./forceInit'),
      noop = require('../../../noop'),
      shell = require('../../../shell');

const readdir = promisify(fs.readdir);

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

  const entries = await readdir(directory);

  if (entries.length > 0) {
    progress({ message: 'The current working directory is not empty.', type: 'info' });

    throw new errors.DirectoryNotEmpty();
  }

  await cloneRepository({ directory, template }, progress);

  await shell.rm('-rf', path.join(directory, '.git'));
};

module.exports = init;
