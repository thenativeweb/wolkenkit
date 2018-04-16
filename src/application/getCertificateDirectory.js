'use strict';

const fs = require('fs'),
      path = require('path');

const promisify = require('util.promisify');

const errors = require('../errors');

const access = promisify(fs.access);

const getCertificateDirectory = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.directory) {
    throw new Error('Directory is missing.');
  }
  if (!options.configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!options.env) {
    throw new Error('Environment is missing.');
  }

  const { directory, configuration, env } = options;

  if (!configuration.environments[env]) {
    throw new errors.EnvironmentNotFound();
  }

  let certificateDirectory = configuration.environments[env].api.certificate;

  if (certificateDirectory) {
    certificateDirectory = path.join(directory, certificateDirectory);
  } else {
    certificateDirectory = path.join(__dirname, '..', '..', 'keys', 'local.wolkenkit.io');
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
