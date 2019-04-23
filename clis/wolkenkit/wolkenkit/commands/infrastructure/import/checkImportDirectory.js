'use strict';

const fs = require('fs');

const promisify = require('util.promisify');

const checkImportEventStore = require('./checkImportEventStore'),
      errors = require('../../../../errors'),
      noop = require('../../../../noop');

const readdir = promisify(fs.readdir);

const checkImportDirectory = async function ({
  importDirectory,
  toEventStore
}, progress = noop) {
  if (!importDirectory) {
    throw new Error('Import directory is missing.');
  }
  if (toEventStore === undefined) {
    throw new Error('To event store is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const entries = await readdir(importDirectory);

  if (entries.length === 0) {
    progress({ message: 'The import directory must not be empty.', type: 'info' });

    throw new errors.DirectoryEmpty();
  }

  if (toEventStore) {
    await checkImportEventStore({ importDirectory }, progress);
  }
};

module.exports = checkImportDirectory;
