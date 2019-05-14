'use strict';

const getTestsFor = require('./getTestsFor'),
      { SqlServer } = require('../../../../stores/eventstore');

suite('SqlServer', () => {
  getTestsFor({
    Eventstore: SqlServer,
    type: 'SqlServer'
  });
});
