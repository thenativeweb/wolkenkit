'use strict';

const certificateDetails = require('certificate-details'),
      promisify = require('util.promisify');

const errors = require('../../errors'),
      getCertificateDirectory = require('./getCertificateDirectory');

const getCertificateDetails = promisify(certificateDetails.get);

const getCertificate = async function ({ configuration, directory }) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }

  const certificateDirectory = await getCertificateDirectory({ configuration, directory });

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
