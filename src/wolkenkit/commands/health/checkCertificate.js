'use strict';

const application = require('../../application'),
      errors = require('../../../errors'),
      { isNameMatching } = require('../../../certificate');

const checkCertificate = async function ({
  configuration,
  directory
}, progress) {
  if (!configuration) {
    throw new Error('Configuration is missing.');
  }
  if (!directory) {
    throw new Error('Directory is missing.');
  }
  if (!progress) {
    throw new Error('Progress is missing.');
  }

  const host = configuration.api.host.name;

  let certificate;

  try {
    certificate = await application.getCertificate({ configuration, directory });
  } catch (ex) {
    switch (ex.code) {
      case 'EDIRECTORYNOTFOUND':
        progress({ message: 'Application certificate directory not found.', type: 'info' });
        break;
      case 'EFILENOTFOUND':
        progress({ message: 'Application certificate or private key not found.', type: 'info' });
        break;
      default:
        progress({ message: ex.message, type: 'info' });
    }

    throw ex;
  }

  if (certificate.subject.commonName === certificate.issuer.commonName) {
    progress({ message: 'Application certificate is self-signed.', type: 'warn' });
  }
  if (!isNameMatching({ certificate, name: host })) {
    progress({ message: `Application certificate does not match application host ${host}.`, type: 'info' });
    throw new errors.CertificateMismatch();
  }

  const now = new Date();

  if (certificate.metadata.validTo < now) {
    progress({ message: 'Application certificate has expired.', type: 'info' });
    throw new errors.CertificateExpired();
  }
  if (now < certificate.metadata.validFrom) {
    progress({ message: 'Application certificate is not yet valid.', type: 'info' });
    throw new errors.CertificateNotYetValid();
  }
};

module.exports = checkCertificate;
