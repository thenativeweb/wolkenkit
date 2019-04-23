'use strict';

const path = require('path');

const assert = require('assertthat');

const applicationManager = require('../../../../../common/application/applicationManager');

suite('[common/application] invalidWithWriteModelMissing', () => {
  test('throws an error.', async () => {
    await assert.that(async () => {
      await applicationManager.load({
        directory: path.join(__dirname, '..', '..', '..', '..', 'shared', 'common', 'application', 'invalidWithWriteModelMissing')
      });
    }).is.throwingAsync('Missing required property: writeModel (at ./server/writeModel).');
  });
});
