'use strict';

const certificateDetails = require('certificate-details'),
      promisify = require('util.promisify');

const errors = require('../errors'),
      getCertificateDirectory = require('./getCertificateDirectory');

const getCertificateDetails = promisify(certificateDetails.get);

const getCertificate = async function (options) {
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

  const certificateDirectory = await getCertificateDirectory({ directory, configuration, env });

  let certificate;

  try {
    certificate = await getCertificateDetails(certificateDirectory);
  } catch (ex) {
    if (ex.code === 'ENOENT') {
      throw new errors.FileNotFound();
    }

    throw ex;
  }

  return certificate;
};

module.exports = getCertificate;
