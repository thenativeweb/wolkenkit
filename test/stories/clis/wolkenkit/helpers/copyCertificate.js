'use strict';

const fs = require('fs'),
      path = require('path'),
      { promisify } = require('util');

const shell = require('../../../../../clis/wolkenkit/shell');

const copyFile = promisify(fs.copyFile);

const copyCertificate = async function (options) {
  if (!options) {
    throw new Error('Options are missing.');
  }
  if (!options.ipAddress) {
    throw new Error('IP address is missing.');
  }
  if (!options.to) {
    throw new Error('To is missing.');
  }

  const { to, ipAddress } = options;

  const sourceCertificate = path.join(__dirname, '..', 'terraform', '.docker', ipAddress, 'cert.pem');
  const sourcePrivateKey = path.join(__dirname, '..', 'terraform', '.docker', ipAddress, 'key.pem');

  const targetCertificate = path.join(to, 'certificate.pem');
  const targetPrivateKey = path.join(to, 'privateKey.pem');

  await shell.mkdir('-p', to);

  await copyFile(sourceCertificate, targetCertificate);
  await copyFile(sourcePrivateKey, targetPrivateKey);
};

module.exports = copyCertificate;
