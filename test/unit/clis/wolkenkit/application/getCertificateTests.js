'use strict';

const path = require('path');

const assert = require('assertthat');

const getCertificate = require('../../../../../clis/wolkenkit/application/getCertificate');

suite('getCertificate', () => {
  test('is a function.', done => {
    assert.that(getCertificate).is.ofType('function');
    done();
  });

  test('throws an error if configuration is missing.', async () => {
    await assert.that(async () => {
      await getCertificate({});
    }).is.throwingAsync('Configuration is missing.');
  });

  test('throws an error if directory is missing.', async () => {
    await assert.that(async () => {
      await getCertificate({
        configuration: {}
      });
    }).is.throwingAsync('Directory is missing.');
  });

  test('throws an error if the certificate directory does not exist.', async () => {
    await assert.that(async () => {
      await getCertificate({
        directory: __dirname,
        configuration: { api: { host: { certificate: '/non-existent' }}}
      });
    }).is.throwingAsync(ex => ex.code === 'EDIRECTORYNOTFOUND');
  });

  test('throws an error if the certificate does not exist.', async () => {
    await assert.that(async () => {
      await getCertificate({
        directory: path.join(__dirname, '..', '..', '..', '..', 'shared'),
        configuration: { api: { host: { certificate: '/keys/empty' }}}
      });
    }).is.throwingAsync(ex => ex.code === 'EFILENOTFOUND');
  });

  test('returns the certificate.', async () => {
    const certificate = await getCertificate({
      directory: path.join(__dirname, '..', '..', '..', '..', 'shared'),
      configuration: { api: { host: { certificate: '/keys/local.wolkenkit.io' }}}
    });

    assert.that(certificate.subject.commonName).is.equalTo('local.wolkenkit.io');
  });
});
