'use strict';

const getTestsFor = require('./getTestsFor'),
      { SqlServer } = require('../../../../storage/eventstore');

suite('SqlServer', () => {
  getTestsFor({
    Eventstore: SqlServer,
    type: 'SqlServer'
  });
});
