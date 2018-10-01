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

  const entries = await readdir(directory);

  if (entries.length > 0) {
    progress({ message: 'The current working directory is not empty.', type: 'info' });

    throw new errors.DirectoryNotEmpty();
  }

  await cloneRepository({ directory, template }, progress);

  await shell.rm('-rf', path.join(directory, '.git'));
};

module.exports = init;
