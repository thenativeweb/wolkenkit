'use strict';

const fs = require('fs');

const promisify = require('util.promisify');

const errors = require('../../../errors');

const readdir = promisify(fs.readdir);

const checkDirectory = async function ({ directory, force }, progress) {
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (force === undefined) {
    throw new Error('Force is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  if (force) {
    return;
  }

  const entries = await readdir(directory);

  if (entries.length > 0) {
    progress({ message: 'The current working directory is not empty.', type: 'info' });

    throw new errors.DirectoryNotEmpty();
  }
};

module.exports = checkDirectory;
