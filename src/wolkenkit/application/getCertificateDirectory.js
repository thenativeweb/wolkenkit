'use strict';

const fs = require('fs'),
      path = require('path');

const promisify = require('util.promisify');

const defaults = require('../defaults.json'),
      errors = require('../../errors');

const access = promisify(fs.access);

const getCertificateDirectory = async function ({ configuration, directory }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }

  const certificateDirectory =
    path.join(directory, configuration.api.host.certificate);

  try {
    await access(certificateDirectory, fs.constants.R_OK);
  } catch (ex) {
    if (ex.code === 'ENOENT') {
      throw new errors.DirectoryNotFound();
    }

    throw ex;
  }

  return certificateDirectory;
};

module.exports = getCertificateDirectory;
