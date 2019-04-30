'use strict';

const connectionStrings = require('../../../shared/connectionStrings'),
      getTestsFor = require('./getTestsFor'),
      { MariaDb } = require('../../../../storage/eventstore');

suite('MariaDb', () => {
  getTestsFor({
    Eventstore: MariaDb,
    type: 'MariaDb',
    url: connectionStrings.mariaDb.integrationTests
  });
});
