'use strict';

const getTestsFor = require('./getTestsFor'),
      { SqlServer } = require('../../../../stores/lockstore');

suite('SqlServer', () => {
  getTestsFor({
    Lockstore: SqlServer,
    type: 'SqlServer'
  });
});
