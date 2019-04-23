'use strict';

const path = require('path');

const assert = require('assertthat');

const applicationManager = require('../../../../../common/application/applicationManager');

suite('[common/application] invalidWithDirectoriesWithoutIndex', () => {
  test('throws an error.', async () => {
    await assert.that(async () => {
      await applicationManager.load({
        directory: path.join(__dirname, '..', '..', '..', '..', 'shared', 'common', 'application', 'invalidWithDirectoriesWithoutIndex')
      });
    }).is.throwingAsync('Missing required property: initialState (at ./server/writeModel/planning/peerGroup/initialState).');
  });
});
