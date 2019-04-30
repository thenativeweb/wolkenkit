'use strict';

const connectionStrings = require('../../../shared/connectionStrings'),
      getTestsFor = require('./getTestsFor'),
      { MySql } = require('../../../../storage/eventstore');

suite('MySql', () => {
  getTestsFor({
    Eventstore: MySql,
    type: 'MySql',
    url: connectionStrings.mySql.integrationTests
  });
});
