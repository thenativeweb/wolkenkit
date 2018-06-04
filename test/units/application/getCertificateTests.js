'use strict';

const path = require('path');

const assert = require('assertthat');

const getCertificate = require('../../../src/application/getCertificate');

suite('application/getCertificate', () => {
  test('is a function.', done => {
    assert.that(getCertificate).is.ofType('function');
    done();
  });

  test('throws an error if options are missing.', async () => {
    await assert.that(async () => {
      await getCertificate();
    }).is.throwingAsync('Options are missing.');
  });

  test('throws an error if directory is missing.', async () => {
    await assert.that(async () => {
      await getCertificate({});
    }).is.throwingAsync('Directory is missing.');
  });

  test('throws an error if configuration missing.', async () => {
    await assert.that(async () => {
      await getCertificate({
        directory: __dirname
      });
    }).is.throwingAsync('Configuration is missing.');
  });

  test('throws an error if environment is missing.', async () => {
    await assert.that(async () => {
      await getCertificate({
        directory: __dirname,
        configuration: {}
      });
    }).is.throwingAsync('Environment is missing.');
  });

  test('throws an error if specified environment is not configured.', async () => {
    await assert.that(async () => {
      await getCertificate({
        directory: __dirname,
        configuration: { environments: {}},
        env: 'non-existent'
      });
    }).is.throwingAsync(ex => ex.code === 'EENVIRONMENTNOTFOUND');
  });

  test('throws an error if the certificate directory does not exist.', async () => {
    await assert.that(async () => {
      await getCertificate({
        directory: __dirname,
        configuration: { environments: { default: { api: { certificate: '/non-existent' }}}},
        env: 'default'
      });
    }).is.throwingAsync(ex => ex.code === 'EDIRECTORYNOTFOUND');
  });

  test('throws an error if the certificate does not exist.', async () => {
    await assert.that(async () => {
      await getCertificate({
        directory: path.join(__dirname, '..', '..', 'shared'),
        configuration: { environments: { default: { api: { certificate: '/keys/empty' }}}},
        env: 'default'
      });
    }).is.throwingAsync(ex => ex.code === 'EFILENOTFOUND');
  });

  test('returns the certificate.', async () => {
    const certificate = await getCertificate({
      directory: path.join(__dirname, '..', '..', 'shared'),
      configuration: { environments: { default: { api: { certificate: '/keys/local.wolkenkit.io' }}}},
      env: 'default'
    });

    assert.that(certificate.subject.commonName).is.equalTo('local.wolkenkit.io');
  });
});
