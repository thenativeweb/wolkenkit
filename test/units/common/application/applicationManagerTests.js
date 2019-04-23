'use strict';

const path = require('path');

const assert = require('assertthat');

const applicationManager = require('../../../../common/application/applicationManager');

suite('[common/application] applicationManager', () => {
  test('is an object.', async () => {
    assert.that(applicationManager).is.ofType('object');
  });

  suite('validate', () => {
    test('is a function.', async () => {
      assert.that(applicationManager.validate).is.ofType('function');
    });

    test('throws an error if the directory is missing.', async () => {
      await assert.that(async () => {
        await applicationManager.validate({});
      }).is.throwingAsync('Directory is missing.');
    });

    test('throws an error if the directory does not exist.', async () => {
      await assert.that(async () => {
        await applicationManager.validate({ directory: path.join(__dirname, '..', '..', '..', 'shared', 'common', 'application', 'non-existent-application') });
      }).is.throwingAsync(ex => ex.code === 'ENOENT');
    });

    test('does not throw an error if the directory exists.', async () => {
      await assert.that(async () => {
        await applicationManager.validate({ directory: path.join(__dirname, '..', '..', '..', 'shared', 'common', 'application', 'valid') });
      }).is.not.throwingAsync();
    });
  });

  suite('load', () => {
    test('is a function.', async () => {
      assert.that(applicationManager.load).is.ofType('function');
    });

    test('throws an error if the directory is missing.', async () => {
      await assert.that(async () => {
        await applicationManager.load({});
      }).is.throwingAsync('Directory is missing.');
    });

    test('throws an error if the directory does not exist.', async () => {
      await assert.that(async () => {
        await applicationManager.load({ directory: path.join(__dirname, '..', '..', '..', 'shared', 'common', 'application', 'non-existent-application') });
      }).is.throwingAsync(ex => ex.code === 'ENOENT');
    });

    test('returns the same instance if called twice with the same application directory.', async () => {
      const application1 = await applicationManager.load({
        directory: path.join(__dirname, '..', '..', '..', 'shared', 'common', 'application', 'valid')
      });
      const application2 = await applicationManager.load({
        directory: path.join(__dirname, '..', '..', '..', 'shared', 'common', 'application', 'valid')
      });

      assert.that(application1).is.sameAs(application2);
    });

    suite('configuration', () => {
      test('is an object.', async () => {
        const application = await applicationManager.load({
          directory: path.join(__dirname, '..', '..', '..', 'shared', 'common', 'application', 'valid')
        });

        assert.that(application.configuration).is.ofType('object');
      });
    });
  });
});
