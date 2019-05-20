'use strict';

const assert = require('assertthat');

const getConfiguration = require('../../../../../clis/wolkenkit/application/getConfiguration'),
      invalidPackageJsonIsInvalid = require('../../../../shared/applications/invalid/packageJsonIsInvalid'),
      invalidPackageJsonIsMissing = require('../../../../shared/applications/invalid/packageJsonIsMissing'),
      invalidPackageJsonWithMissingRuntime = require('../../../../shared/applications/invalid/packageJsonWithMissingRuntime'),
      invalidPackageJsonWithoutWolkenkit = require('../../../../shared/applications/invalid/packageJsonWithoutWolkenkit'),
      invalidPackageJsonWithUnknownRuntimeVersion = require('../../../../shared/applications/invalid/packageJsonWithUnknownRuntimeVersion'),
      validPackageJsonWithoutNodeEnvironment = require('../../../../shared/applications/valid/packageJsonWithoutNodeEnvironment');

suite('getConfiguration', () => {
  test('is a function.', done => {
    assert.that(getConfiguration).is.ofType('function');
    done();
  });

  test('throws an error if directory is missing.', async () => {
    await assert.that(async () => {
      await getConfiguration({});
    }).is.throwingAsync('Directory is missing.');
  });

  test('throws an error if package.json cannot be found.', async () => {
    const directory = await invalidPackageJsonIsMissing();

    await assert.that(async () => {
      await getConfiguration({ directory });
    }).is.throwingAsync(ex => ex.code === 'EFILENOTFOUND');
  });

  test('throws an error if package.json contains format errors.', async () => {
    const directory = await invalidPackageJsonIsInvalid();

    await assert.that(async () => {
      await getConfiguration({ directory });
    }).is.throwingAsync(ex => ex.code === 'EJSONMALFORMED');
  });

  test('throws an error if package.json does not contain a wolkenkit application.', async () => {
    const directory = await invalidPackageJsonWithoutWolkenkit();

    await assert.that(async () => {
      await getConfiguration({ directory });
    }).is.throwingAsync(ex => ex.code === 'ECONFIGURATIONNOTFOUND');
  });

  test('throws an error if package.json does not contain a runtime.', async () => {
    const directory = await invalidPackageJsonWithMissingRuntime();

    await assert.that(async () => {
      await getConfiguration({ directory });
    }).is.throwingAsync(ex => ex.code === 'ECONFIGURATIONMALFORMED');
  });

  test('throws an error if package.json contains an unknown runtime version.', async () => {
    const directory = await invalidPackageJsonWithUnknownRuntimeVersion();

    await assert.that(async () => {
      await getConfiguration({ directory });
    }).is.throwingAsync(ex => ex.code === 'EVERSIONNOTFOUND');
  });

  test('does not throw an error if package.json does not contain node environment.', async () => {
    const directory = await validPackageJsonWithoutNodeEnvironment();

    await assert.that(async () => {
      await getConfiguration({ directory });
    }).is.not.throwingAsync();
  });
});
