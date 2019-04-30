'use strict';

const connectionStrings = require('../../../shared/connectionStrings'),
      getTestsFor = require('./getTestsFor'),
      { SqlServer } = require('../../../../storage/eventstore');

suite('SqlServer', () => {
  getTestsFor({
    Eventstore: SqlServer,
    type: 'SqlServer',
    url: connectionStrings.sqlServer.integrationTests
  });
});
