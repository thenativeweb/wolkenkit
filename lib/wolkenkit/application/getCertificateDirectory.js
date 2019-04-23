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

  let certificateDirectory = configuration.api.host.certificate;

  if (certificateDirectory === defaults.commands.shared.api.host.certificate) {
    certificateDirectory = path.join(__dirname, '..', '..', '..', certificateDirectory);
  } else {
    certificateDirectory = path.join(directory, certificateDirectory);
  }

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
