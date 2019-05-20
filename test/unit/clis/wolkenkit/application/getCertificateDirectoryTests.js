'use strict';

const path = require('path');

const assert = require('assertthat');

const defaults = require('../../../../../clis/wolkenkit/application/defaults.json'),
      getCertificateDirectory = require('../../../../../clis/wolkenkit/application/getCertificateDirectory');

suite('getCertificateDirectory', () => {
  test('is a function.', done => {
    assert.that(getCertificateDirectory).is.ofType('function');
    done();
  });

  test('throws an error if configuration is missing.', async () => {
    await assert.that(async () => {
      await getCertificateDirectory({});
    }).is.throwingAsync('Configuration is missing.');
  });

  test('throws an error if directory is missing.', async () => {
    await assert.that(async () => {
      await getCertificateDirectory({
        configuration: {}
      });
    }).is.throwingAsync('Directory is missing.');
  });

  test('throws an error if the resolved certificate directory does not exist.', async () => {
    await assert.that(async () => {
      await getCertificateDirectory({
        directory: __dirname,
        configuration: { api: { host: { certificate: '/non-existent' }}}
      });
    }).is.throwingAsync(ex => ex.code === 'EDIRECTORYNOTFOUND');
  });

  test('returns the certificate directory if an absolute path is configured.', async () => {
    const directoryBase = path.join(__dirname, '..', '..', '..', '..', 'shared');
    const directoryCertificate = '/keys/localhost';
    const directory = path.join(directoryBase, directoryCertificate);

    const certificateDirectory = await getCertificateDirectory({
      directory: directoryBase,
      configuration: { api: { host: { certificate: directoryCertificate }}}
    });

    assert.that(certificateDirectory).is.equalTo(directory);
  });

  test('returns the certificate directory if a relative path is configured.', async () => {
    const directoryBase = path.join(__dirname, '..', '..', '..', '..', 'shared');
    const directoryCertificate = 'keys/localhost';
    const directory = path.join(directoryBase, directoryCertificate);

    const certificateDirectory = await getCertificateDirectory({
      directory: directoryBase,
      configuration: { api: { host: { certificate: directoryCertificate }}}
    });

    assert.that(certificateDirectory).is.equalTo(directory);
  });

  test('returns the fallback certificate directory if default path is configured.', async () => {
    const certificateDirectory = await getCertificateDirectory({
      directory: __dirname,
      configuration: { api: { host: { certificate: defaults.api.host.certificate }}}
    });

    assert.that(certificateDirectory).is.equalTo(path.join(__dirname, '..', '..', '..', '..', '..', 'keys', 'local.wolkenkit.io'));
  });
});
