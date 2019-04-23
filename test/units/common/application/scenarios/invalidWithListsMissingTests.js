'use strict';

const path = require('path');

const assert = require('assertthat');

const applicationManager = require('../../../../../common/application/applicationManager');

suite('[common/application] invalidWithListsMissing', () => {
  test('throws an error.', async () => {
    await assert.that(async () => {
      await applicationManager.load({
        directory: path.join(__dirname, '..', '..', '..', '..', 'shared', 'common', 'application', 'invalidWithListsMissing')
      });
    }).is.throwingAsync('Missing required property: lists (at ./server/readModel/lists).');
  });
});
