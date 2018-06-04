'use strict';

const path = require('path');

const assert = require('assertthat');

const getCertificateDirectory = require('../../../src/application/getCertificateDirectory'),
      shell = require('../../../src/shell');

suite('application/getCertificateDirectory', () => {
  test('is a function.', done => {
    assert.that(getCertificateDirectory).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', async () => {
    await assert.that(async () => {
      await getCertificateDirectory();
    }).is.throwingAsync('Options are missing.');
  });

  test('throws an error if directory is missing.', async () => {
    await assert.that(async () => {
      await getCertificateDirectory({});
    }).is.throwingAsync('Directory is missing.');
  });

  test('throws an error if configuration missing.', async () => {
    await assert.that(async () => {
      await getCertificateDirectory({
        directory: __dirname
      });
    }).is.throwingAsync('Configuration is missing.');
  });

  test('throws an error if environment is missing.', async () => {
    await assert.that(async () => {
      await getCertificateDirectory({
        directory: __dirname,
        configuration: {}
      });
    }).is.throwingAsync('Environment is missing.');
  });

  test('throws an error if specified environment is not configured.', async () => {
    await assert.that(async () => {
      await getCertificateDirectory({
        directory: __dirname,
        configuration: { environments: {}},
        env: 'non-existent'
      });
    }).is.throwingAsync(ex => ex.code === 'EENVIRONMENTNOTFOUND');
  });

  test('throws an error if the resolved certificate directory does not exist.', async () => {
    await assert.that(async () => {
      await getCertificateDirectory({
        directory: __dirname,
        configuration: { environments: { default: { api: { certificate: '/non-existent' }}}},
        env: 'default'
      });
    }).is.throwingAsync(ex => ex.code === 'EDIRECTORYNOTFOUND');
  });

  test('returns the certificate directory if an absolute path is configured.', async () => {
    const directoryBase = path.join(__dirname, '..', '..', 'shared');
    const directoryCertificate = '/keys/local.wolkenkit.io';
    const directory = path.join(directoryBase, directoryCertificate);

    await shell.mkdir('-p', directory);

    const certificateDirectory = await getCertificateDirectory({
      directory: directoryBase,
      configuration: { environments: { default: { api: { certificate: directoryCertificate }}}},
      env: 'default'
    });

    assert.that(certificateDirectory).is.equalTo(directory);
  });

  test('returns the certificate directory if a relative path is configured.', async () => {
    const directoryBase = path.join(__dirname, '..', '..', 'shared');
    const directoryCertificate = 'keys/local.wolkenkit.io';
    const directory = path.join(directoryBase, directoryCertificate);

    await shell.mkdir('-p', directory);

    const certificateDirectory = await getCertificateDirectory({
      directory: directoryBase,
      configuration: { environments: { default: { api: { certificate: directoryCertificate }}}},
      env: 'default'
    });

    assert.that(certificateDirectory).is.equalTo(directory);
  });

  test('returns the fallback certificate directory if no path is configured.', async () => {
    const certificateDirectory = await getCertificateDirectory({
      directory: __dirname,
      configuration: { environments: { default: { api: {}}}},
      env: 'default'
    });

    assert.that(certificateDirectory).is.equalTo(path.join(__dirname, '..', '..', '..', 'keys', 'local.wolkenkit.io'));
  });
});
